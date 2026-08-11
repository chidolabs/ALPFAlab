// One-time bootstrap: auto-assign room_sessions.covering_volunteer_id from
// partnership_assignments wherever a session's company clearly matches one
// (and only one) partner lead's sponsor company. Never overwrites a session
// that already has a covering volunteer or free-text name set.
// Usage: npm run auto-assign-coverage
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/auto-assign-partner-coverage.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });

function normCompany(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b(llp|llc|inc\.?|corp\.?|corporation|co\.?)\b/g, "")
    .trim();
}

function companiesMatch(a, b) {
  const x = normCompany(a);
  const y = normCompany(b);
  return x === y || x.includes(y) || y.includes(x);
}

async function main() {
  const { data: assignments, error: assignError } = await supabase
    .from("partnership_assignments")
    .select("volunteer_id, sponsor_company");
  if (assignError) throw new Error(assignError.message);

  const { data: sessions, error: sessionsError } = await supabase
    .from("room_sessions")
    .select("id, company, covering_volunteer_id, covering_volunteer_name");
  if (sessionsError) throw new Error(sessionsError.message);

  const unassigned = (sessions ?? []).filter((s) => !s.covering_volunteer_id && !s.covering_volunteer_name);

  let updated = 0;
  const ambiguous = new Set();
  const noMatch = new Set();

  for (const s of unassigned) {
    const matches = (assignments ?? []).filter((a) => companiesMatch(a.sponsor_company, s.company));
    const uniqueVolunteers = new Set(matches.map((m) => m.volunteer_id));

    if (uniqueVolunteers.size === 1) {
      const [volunteerId] = uniqueVolunteers;
      const { error } = await supabase
        .from("room_sessions")
        .update({ covering_volunteer_id: volunteerId })
        .eq("id", s.id);
      if (error) throw new Error(error.message);
      updated++;
    } else if (uniqueVolunteers.size > 1) {
      ambiguous.add(s.company);
    } else {
      noMatch.add(s.company);
    }
  }

  console.log(`Auto-assigned ${updated} of ${unassigned.length} unassigned room sessions.`);
  if (ambiguous.size) console.log(`Skipped (multiple partner leads matched): ${[...ambiguous].join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
