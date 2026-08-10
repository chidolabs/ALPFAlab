// One-time seed of the room_sessions table from the printed "Room Quick View"
// sheet (Monday + Tuesday). Labels are transcribed as printed, even where
// abbreviated (e.g. "C EIA", "Deloitte-Chemistry") — no guessed expansions.
// Safe to re-run: clears and reloads this table only.
// Usage: npm run seed-rooms
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/seed-room-sessions.mjs"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });

const ROOMS = {
  "E217": 210,
  "E218": 147,
  "E219 A": 294,
  "E219 BC": 245,
  "E219 D": 294,
  "E221 A": 100,
  "W206 A": 175,
  "W206 B": 175,
  "W207 A": 140,
  "W207 BC": 119,
  "W208": 218,
};

// [room, day, timeLabel, timeOrder(minutes since midnight), company, cpe]
const MONDAY = 3; // day_order: Sat=1, Sun=2, Mon=3, Tue=4, Wed=5, Thu=6
const TUESDAY = 4;
const WEDNESDAY = 5;

const ROWS = [
  // Monday: 11:30, 2:00, 3:30
  ["E217", MONDAY, "11:30 AM", 690, "Morgan Stanley", false],
  ["E217", MONDAY, "2:00 PM", 840, "C AT & AV", true],
  ["E217", MONDAY, "3:30 PM", 930, "PNC", false],

  ["E218", MONDAY, "11:30 AM", 690, "Deloitte-Work", true],
  ["E218", MONDAY, "2:00 PM", 840, "C EIA", false],
  ["E218", MONDAY, "3:30 PM", 930, "Deloitte-Cyber", true],

  ["E219 A", MONDAY, "11:30 AM", 690, "Robert Half", true],
  ["E219 A", MONDAY, "2:00 PM", 840, "VISA", false],
  ["E219 A", MONDAY, "3:30 PM", 930, "C I2I", false],

  ["E219 BC", MONDAY, "11:30 AM", 690, "Microsoft", true],
  ["E219 BC", MONDAY, "2:00 PM", 840, "PWC", false],
  ["E219 BC", MONDAY, "3:30 PM", 930, "Microsoft", true],

  ["E219 D", MONDAY, "11:30 AM", 690, "RSM", true],
  ["E219 D", MONDAY, "2:00 PM", 840, "Andersen", true],

  ["E221 A", MONDAY, "11:30 AM", 690, "Caterpillar", true],
  ["E221 A", MONDAY, "2:00 PM", 840, "HSBC Self", false],
  ["E221 A", MONDAY, "3:30 PM", 930, "YPTC", false],

  ["W206 A", MONDAY, "11:30 AM", 690, "Deloitte-Chemistry", false],
  ["W206 A", MONDAY, "2:00 PM", 840, "C DTS", false],
  ["W206 A", MONDAY, "3:30 PM", 930, "C Miami", false],

  ["W206 B", MONDAY, "11:30 AM", 690, "EY-Navigating", false],
  ["W206 B", MONDAY, "2:00 PM", 840, "Bloomberg-Human", false],
  ["W206 B", MONDAY, "3:30 PM", 930, "Withum", false],

  ["W207 A", MONDAY, "11:30 AM", 690, "GT-Student", false],
  ["W207 A", MONDAY, "2:00 PM", 840, "Baker Tilly", true],

  ["W207 BC", MONDAY, "11:30 AM", 690, "BNY-Students", false],
  ["W207 BC", MONDAY, "2:00 PM", 840, "Amazon", false],

  ["W208", MONDAY, "11:30 AM", 690, "Moody's-Campus", false],
  ["W208", MONDAY, "2:00 PM", 840, "BDO", false],
  ["W208", MONDAY, "3:30 PM", 930, "Jeff Valdez", false],

  // Tuesday: 11:00, 3:00
  ["E217", TUESDAY, "11:00 AM", 660, "Protiviti", true],
  ["E217", TUESDAY, "3:00 PM", 900, "EY-AI", true],

  ["E218", TUESDAY, "11:00 AM", 660, "Deloitte-CPA", false],
  ["E218", TUESDAY, "3:00 PM", 900, "USAA-EI", false],

  ["E219 A", TUESDAY, "11:00 AM", 660, "Forvis Mazars", true],
  ["E219 A", TUESDAY, "3:00 PM", 900, "Accenture", true],

  ["E219 BC", TUESDAY, "11:00 AM", 660, "JPMC", false],
  ["E219 BC", TUESDAY, "3:00 PM", 900, "CBIZ-PRO", true],

  ["E219 D", TUESDAY, "11:00 AM", 660, "LFG PRO", false],
  ["E219 D", TUESDAY, "3:00 PM", 900, "Crowe-AI", true],

  ["E221 A", TUESDAY, "11:00 AM", 660, "Abbvie", true],
  ["E221 A", TUESDAY, "3:00 PM", 900, "HSBC Wellbeing", true],

  ["W206 A", TUESDAY, "11:00 AM", 660, "C-New Jersey", false],
  ["W206 A", TUESDAY, "3:00 PM", 900, "Becker", false],

  ["W206 B", TUESDAY, "11:00 AM", 660, "Bloomberg", false],
  ["W206 B", TUESDAY, "3:00 PM", 900, "C BFT", false],

  ["W207 A", TUESDAY, "11:00 AM", 660, "Microsoft", true],
  ["W207 A", TUESDAY, "3:00 PM", 900, "C Baltimore", false],

  ["W207 BC", TUESDAY, "11:00 AM", 660, "Fidelity-Money", false],
  ["W207 BC", TUESDAY, "3:00 PM", 900, "Ally-Info Session", false],

  ["W208", TUESDAY, "11:00 AM", 660, "BoA-Legacy", false],
  ["W208", TUESDAY, "3:00 PM", 900, "FMR", false],

  // Wednesday: 12:00 (top grid only has one Wednesday column)
  ["E217", WEDNESDAY, "12:00 PM", 720, "CLA", false],
  ["E218", WEDNESDAY, "12:00 PM", 720, "BoA-AI", false],
  ["E219 A", WEDNESDAY, "12:00 PM", 720, "RBC PRO", false],
  ["E219 BC", WEDNESDAY, "12:00 PM", 720, "C FF", false],
  ["E219 D", WEDNESDAY, "12:00 PM", 720, "LFG PRO", false],
  ["E221 A", WEDNESDAY, "12:00 PM", 720, "C C2C", false],

  // --- Bottom grid: workshops/info sessions/receptions/activations by room ---
  // No CPE shading in this section (all false). Room labels kept exactly as
  // printed, including "W206B" (no space) here vs "W206 B" (with space) in
  // the top grid — they may be the same physical room, but the two grids
  // show conflicting sessions at the same Monday 11:30 AM slot, so they're
  // NOT merged; flagged for the team to reconcile against the source sheet.
  ["W209C", MONDAY, "11:30 AM", 690, "Film Screening", false],
  ["W209C", TUESDAY, "10:40 AM", 640, "Jorge Ramos", false],
  ["W209C", WEDNESDAY, "2:00 PM", 840, "Damian - Fireside", false],

  ["E212A", TUESDAY, "11:00 AM", 660, "PWC", false],

  ["E212C", MONDAY, "11:30 AM", 690, "Refugio Roundtable", false],
  ["E212C", WEDNESDAY, "9:30 AM", 570, "Diaspora - Puerto Rico", false],

  ["E220BC", MONDAY, "8:15 AM", 495, "Concierge", false],
  ["E220BC", TUESDAY, "11:00 AM", 660, "Student Roundtable", false],
  ["E220BC", TUESDAY, "12:30 PM", 750, "Wells Fargo", false],

  ["E220F", MONDAY, "8:15 AM", 495, "Fidelity", false],
  ["E220F", TUESDAY, "12:30 PM", 750, "PWC", false],

  ["E220E", MONDAY, "8:15 AM", 495, "Moody's", false],
  ["E220E", MONDAY, "11:30 AM", 690, "Fidelity", false],
  ["E220E", TUESDAY, "12:30 PM", 750, "Deloitte", false],

  ["E220D", MONDAY, "7:30 AM", 450, "Fidelity Partners", false],
  ["E220D", TUESDAY, "12:30 PM", 750, "Wells Fargo", false],
  ["E220D", TUESDAY, "5:00 PM", 1020, "Alumni Cafecito", false],

  ["E220A", MONDAY, "11:30 AM", 690, "Becker | Withum", false],
  ["E220A", TUESDAY, "12:30 PM", 750, "KPMG", false],
  ["E220A", TUESDAY, "5:00 PM", 1020, "Tony Curtis - Executive", false],

  ["W206B", MONDAY, "11:30 AM", 690, "WOA", false],
  ["W206B", MONDAY, "5:00 PM", 1020, "Boston - Trivia", false],
  ["W206B", TUESDAY, "5:00 PM", 1020, "BofA", false],
];

const DAY_LABELS = { [MONDAY]: "Monday", [TUESDAY]: "Tuesday", [WEDNESDAY]: "Wednesday" };

async function main() {
  const rows = ROWS.map(([room, dayOrder, timeLabel, timeOrder, company, cpe]) => ({
    room,
    capacity: ROOMS[room] ?? null,
    day_order: dayOrder,
    day_label: DAY_LABELS[dayOrder],
    time_label: timeLabel,
    time_order: timeOrder,
    company,
    cpe,
  }));

  const { error: deleteError } = await supabase
    .from("room_sessions")
    .delete()
    .gt("created_at", "1970-01-01");
  if (deleteError) throw new Error(deleteError.message);

  const { data, error } = await supabase.from("room_sessions").insert(rows).select();
  if (error) throw new Error(error.message);
  console.log(`Seeded ${data.length} room sessions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
