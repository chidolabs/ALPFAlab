// One-time seed of the key_contacts table from the convention contact sheet.
// Safe to re-run: skips areas that already have rows, so it won't duplicate
// on repeat runs, but it also won't overwrite edits made from the app.
// Usage: npm run seed-contacts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/seed-contacts.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });

const CONTACTS = [
  {
    area: "General Volunteer Questions/Support",
    name: "Maria Mwangi",
    role: null,
    phone: "210-848-8493",
    email: null,
    notes: "Whatsapp Group Chat, and/or Volunteer Leads",
  },
  {
    area: "Housing",
    name: "Micky Hernandez",
    role: "Conference Direct (Housing Lead)",
    phone: null,
    email: "micky.hernandez@conferencedirect.com",
    notes: null,
  },
  {
    area: "Housing",
    name: "Julie Reilly",
    role: "Conference Direct (Housing Lead)",
    phone: null,
    email: "julie.reilly@conferencedirect.com",
    notes: null,
  },
  {
    area: "Partnerships",
    name: "Asriel Olivares",
    role: "Volunteer Lead",
    phone: "702-912-3627",
    email: null,
    notes: null,
  },
  {
    area: "Partnerships",
    name: "Sandy Paulino",
    role: "ALPFA National",
    phone: "717-819-8926",
    email: null,
    notes: null,
  },
  {
    area: "Registration & Information",
    name: "Maria Di Constanzo",
    role: null,
    phone: "267-808-8369",
    email: null,
    notes: "Located at registration deck",
  },
  {
    area: "Registration & Information",
    name: "Charlin Peguero",
    role: null,
    phone: "646-643-3910",
    email: null,
    notes: "Located at registration deck",
  },
  {
    area: "Registration & Information",
    name: "Michelle Cardenas",
    role: "ALPFA National",
    phone: null,
    email: null,
    notes: null,
  },
  {
    area: "Expo & Experiences",
    name: "Juan Cantu Jr.",
    role: "Volunteer Lead",
    phone: "713-498-6927",
    email: null,
    notes: "Whatsapp Group (Link)",
  },
  {
    area: "Expo & Experiences",
    name: "Clarissa Velez-Cantu",
    role: "Volunteer Lead",
    phone: "713-826-1751",
    email: null,
    notes: null,
  },
  {
    area: "Speakers & Stage",
    name: "Abdel Mozeb",
    role: "Volunteer Lead",
    phone: "646-752-9844",
    email: null,
    notes: null,
  },
  {
    area: "Chapter Leaders",
    name: "Jamelfrey Pacheco",
    role: "ALPFA National",
    phone: null,
    email: "chapterrelations@national.alpfa.org",
    notes: null,
  },
  {
    area: "Marketing",
    name: "Christine Rice",
    role: "ALPFA National",
    phone: "646-770-6948",
    email: "christine.rice@national.alpfa.org",
    notes: null,
  },
  {
    area: "Concierge Program",
    name: "Ilene Chavez-Jaimes",
    role: "Volunteer Lead",
    phone: "818-521-2723",
    email: null,
    notes: null,
  },
  {
    area: "WIFI",
    name: "Karl Seeba",
    role: "General Manager, Smart City Networks",
    phone: "704-572-9358",
    email: "kseeba@smartcity.com",
    notes: null,
  },
];

async function main() {
  const { data: existing, error: existingError } = await supabase.from("key_contacts").select("area");
  if (existingError) throw new Error(existingError.message);
  const existingAreas = new Set((existing ?? []).map((r) => r.area));

  const toInsert = CONTACTS.filter((c) => !existingAreas.has(c.area));
  if (toInsert.length === 0) {
    console.log("All areas already have contacts on file, nothing to seed.");
    return;
  }

  const { data, error } = await supabase.from("key_contacts").insert(toInsert).select();
  if (error) throw new Error(error.message);
  console.log(`Seeded ${data.length} contacts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
