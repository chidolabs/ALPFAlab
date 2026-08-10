// Imports the ALPFA convention spreadsheets into Supabase.
// Usage: npm run import -- "<PartnerVolunteerKeyInfo.xlsx path>" "<Final Volunteer List & Schedule.xlsx path>"
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const [, , partnerFilePath, scheduleFilePath] = process.argv;

if (!partnerFilePath || !scheduleFilePath) {
  console.error(
    'Usage: npm run import -- "<PartnerVolunteerKeyInfo.xlsx>" "<Final Volunteer List & Schedule.xlsx>"'
  );
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/import-data.mjs ..."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false },
});

const DAY_LABELS = {
  1: "Saturday",
  2: "Sunday",
  3: "Monday",
  4: "Tuesday",
  5: "Wednesday",
  6: "Thursday",
};

function norm(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normCompany(value) {
  return norm(value).replace(/\b(llp|llc|inc\.?|corp\.?|corporation|co\.?)\b/g, "").trim();
}

function parseDay(value) {
  const match = String(value ?? "").match(/(\d+)/);
  if (!match) return { day_order: null, day_label: null };
  const order = Number(match[1]);
  return { day_order: order, day_label: DAY_LABELS[order] ?? null };
}

function parseTime(value) {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let [, hourStr, minute, second, suffix] = match;
  let hour = Number(hourStr);
  if (suffix) {
    const isPM = suffix.toUpperCase() === "PM";
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
  }
  return `${String(hour).padStart(2, "0")}:${minute}:${second ?? "00"}`;
}

function cleanPhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function splitRoles(value) {
  if (!value) return [];
  return String(value)
    .split(";")
    .map((r) => r.trim())
    .filter(Boolean);
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

async function truncate(table) {
  const { error } = await supabase.from(table).delete().gt("created_at", "1970-01-01");
  if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
}

async function batchInsert(table, rows, chunkSize = 400) {
  const inserted = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(table).insert(chunk).select();
    if (error) throw new Error(`Failed to insert into ${table}: ${error.message}`);
    inserted.push(...data);
  }
  return inserted;
}

async function main() {
  const partnerWb = XLSX.readFile(partnerFilePath, { cellDates: true });
  const scheduleWb = XLSX.readFile(scheduleFilePath, { cellDates: true });

  // ---- volunteers ----
  const volunteerRows = readSheet(scheduleWb, "Volunteer Time Pref")
    .filter((r) => norm(r["Status"]) !== "none" && r["Schedule Lookup"])
    .map((r) => ({
      volunteer_id: r["Internal VolunteerID"],
      full_name: String(r["Schedule Lookup"]).trim(),
      first_name: r["First Name"] ? String(r["First Name"]).trim() : null,
      last_name: r["Last Name"] ? String(r["Last Name"]).trim() : null,
      email: r["Email"] ? String(r["Email"]).trim().toLowerCase() : null,
      phone: cleanPhone(r["Phone"]),
      member_type: r["Member Type"] ? String(r["Member Type"]).trim() : null,
      team: r["Volunteer Team"] && r["Volunteer Team"] !== "-" ? String(r["Volunteer Team"]).trim() : null,
      status: r["Status"] ? String(r["Status"]).trim() : null,
      roles: splitRoles(r["Volunteer Roles"]),
    }));

  // de-dupe by volunteer_id (keep first)
  const seenIds = new Set();
  const dedupedVolunteers = volunteerRows.filter((v) => {
    if (!v.volunteer_id || seenIds.has(v.volunteer_id)) return false;
    seenIds.add(v.volunteer_id);
    return true;
  });

  await truncate("shifts");
  await truncate("partnership_assignments");
  await truncate("volunteers");
  await truncate("sponsor_contacts");
  await truncate("conf_schedule");

  const insertedVolunteers = await batchInsert("volunteers", dedupedVolunteers);
  console.log(`volunteers: inserted ${insertedVolunteers.length}`);

  const byName = new Map();
  const byEmail = new Map();
  for (const v of insertedVolunteers) {
    byName.set(norm(v.full_name), v.id);
    if (v.email) byEmail.set(v.email, v.id);
  }

  // ---- shifts ----
  const roomLookup = new Map(
    readSheet(scheduleWb, "Room Lookup").map((r) => [norm(r["Session"]), r["Location"]])
  );
  const masterSchedule = readSheet(scheduleWb, "Master Schedule");
  const shiftRows = [];
  const unmatchedShiftNames = new Set();
  for (const r of masterSchedule) {
    const combined = r["Combined"];
    if (!combined || !String(combined).trim()) continue;
    const volunteerId = byName.get(norm(combined));
    if (!volunteerId) {
      unmatchedShiftNames.add(combined);
      continue;
    }
    const { day_order, day_label } = parseDay(r["Day"]);
    const leads = [r["Lead 1"], r["Lead 2"], r["Lead 3"]]
      .map((l) => (l ? String(l).trim() : ""))
      .filter((l) => l && l !== "-");
    shiftRows.push({
      volunteer_id: volunteerId,
      day_order,
      day_label,
      start_time: parseTime(r["Start Time"]),
      end_time: parseTime(r["End Time "]),
      session: r["Session"] ? String(r["Session"]).trim() : "",
      location:
        (r["Location/Room"] && String(r["Location/Room"]).trim()) ||
        roomLookup.get(norm(r["Session"])) ||
        null,
      team: r["Team"] ? String(r["Team"]).trim() : null,
      leads,
    });
  }
  const insertedShifts = await batchInsert("shifts", shiftRows);
  console.log(`shifts: inserted ${insertedShifts.length}, unmatched volunteer names: ${unmatchedShiftNames.size}`);
  if (unmatchedShiftNames.size) console.log("  unmatched:", [...unmatchedShiftNames].join(", "));

  // ---- sponsor_contacts ----
  const sponsorContactRows = readSheet(partnerWb, "Sponsor Contact List")
    .filter((r) => r["Account Name "])
    .map((r) => ({
      company_name: String(r["Account Name "]).trim(),
      first_name: r["First Name"] ? String(r["First Name"]).trim() : null,
      last_name: r["Last Name"] ? String(r["Last Name"]).trim() : null,
      title: r["Title"] ? String(r["Title"]).trim() : null,
      email: r["Primary Email"] ? String(r["Primary Email"]).trim().toLowerCase() : null,
      phone: cleanPhone(r["Phone"]),
      sponsorship_level: r["Convention Sponsorship"] ? String(r["Convention Sponsorship"]).trim() : null,
    }));
  const insertedSponsorContacts = await batchInsert("sponsor_contacts", sponsorContactRows);
  console.log(`sponsor_contacts: inserted ${insertedSponsorContacts.length}`);

  const companyNames = new Set(sponsorContactRows.map((r) => normCompany(r.company_name)));
  function companyKnown(name) {
    const n = normCompany(name);
    if (companyNames.has(n)) return true;
    for (const known of companyNames) {
      if (known.includes(n) || n.includes(known)) return true;
    }
    return false;
  }

  // ---- partnership_assignments ----
  const partnershipTeam = readSheet(partnerWb, "Partnership Team");
  const partnershipRows = [];
  const unmatchedPartnershipVolunteers = new Set();
  const unmatchedCompanies = new Set();
  for (const r of partnershipTeam) {
    const email = r["Email"] ? String(r["Email"]).trim().toLowerCase() : null;
    const fullName = `${r["First Name"] ?? ""} ${r["Last Name"] ?? ""}`.trim();
    const volunteerId = (email && byEmail.get(email)) || byName.get(norm(fullName));
    if (!volunteerId) {
      unmatchedPartnershipVolunteers.add(fullName || email);
      continue;
    }
    for (const col of ["Sponsor 1", "Sponsor 2", "Sponsor 3", "Sponsor 4"]) {
      const company = r[col];
      if (!company || !String(company).trim()) continue;
      const name = String(company).trim();
      if (!companyKnown(name)) unmatchedCompanies.add(name);
      partnershipRows.push({ volunteer_id: volunteerId, sponsor_company: name });
    }
  }
  const insertedPartnerships = await batchInsert("partnership_assignments", partnershipRows);
  console.log(
    `partnership_assignments: inserted ${insertedPartnerships.length}, unmatched volunteers: ${unmatchedPartnershipVolunteers.size}, companies not found in Sponsor Contact List: ${unmatchedCompanies.size}`
  );
  if (unmatchedPartnershipVolunteers.size)
    console.log("  unmatched volunteers:", [...unmatchedPartnershipVolunteers].join(", "));
  if (unmatchedCompanies.size) console.log("  unmatched companies:", [...unmatchedCompanies].join(", "));

  // ---- conf_schedule ----
  const confScheduleRows = readSheet(scheduleWb, "Conf Schedule")
    .filter((r) => r["Session"])
    .map((r) => {
      const { day_order, day_label } = parseDay(r["Day"]);
      return {
        session: String(r["Session"]).trim(),
        type: r["Type"] ? String(r["Type"]).trim() : null,
        room: r["Room"] ? String(r["Room"]).trim() : null,
        day_order,
        day_label,
        start_time: parseTime(r["Start Time"]),
        end_time: parseTime(r["End Time "]),
      };
    });
  const insertedConfSchedule = await batchInsert("conf_schedule", confScheduleRows);
  console.log(`conf_schedule: inserted ${insertedConfSchedule.length}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
