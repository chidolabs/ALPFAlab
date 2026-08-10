# ALPFA Convention Volunteer Hub

A mobile-friendly hub that replaces several scattered spreadsheets with one
place for convention volunteers to look up their team, schedule, and sponsor
contacts. Built with Next.js, Tailwind, and Supabase, deployed on Vercel.

## What's in the app

A shared passcode gate protects the whole app (see Access below), then four
tabs:

- **My Info** — search your name, see your team, contact info, roles, and
  (if you're on the Partnership Team) your assigned sponsor companies with
  each company's contact person.
- **Schedule** — your shifts, grouped by day, with time/session/location.
- **Directory** — all sponsor/partner contacts, grouped alphabetically by
  company, searchable by company or person.
- **Sessions** — the full conference schedule, filterable by category,
  grouped by day.

Light/dark mode toggle in the header; your name selection is remembered
across visits (stored in the browser, not tied to an account).

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` (already gitignored) with:

```
SUPABASE_URL=your-project-url
SUPABASE_SECRET_KEY=your-secret-key
APP_PASSCODE=whatever-you-want-volunteers-to-type
```

Get the Supabase values from the dashboard under Project Settings > API.
Use the **secret** key, not the anon/publishable key — it's only ever read
server-side (see `src/lib/supabase-server.ts`, which imports `server-only`),
so it's safe as long as it's never prefixed with `NEXT_PUBLIC_`.

`APP_PASSCODE` is the one password the whole volunteer team shares to get
past `/login`. Change it any time by editing this value (and the same
variable in Vercel).

## Database schema

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL
editor (Project > SQL Editor > New query) to create the five tables:
`volunteers`, `shifts`, `partnership_assignments`, `sponsor_contacts`,
`conf_schedule`. Re-running it is safe — it won't wipe existing data.

## Importing data from the spreadsheets

Rather than pasting hundreds of rows by hand, `scripts/import-data.mjs`
reads the two source spreadsheets and loads all five tables in one pass —
matching shifts and partnership assignments to volunteers by name/email,
and sponsor companies to their contacts. Run it whenever the spreadsheets
are updated:

```bash
npm run import -- "<PartnerVolunteerKeyInfo.xlsx path>" "<Final Volunteer List & Schedule.xlsx path>"
```

It prints an unmatched-name/company report at the end — anyone or any
company it couldn't confidently link gets listed so you can fix the source
spreadsheet (usually a spelling mismatch) and re-run. **The import clears
and reloads all five tables each run** — it's meant to be the source of
truth, not additive.

The script never copies the spreadsheets into the repo — only file paths
are passed in, so no volunteer PII ends up in git history.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repo.
3. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `APP_PASSCODE` as
   Environment Variables in the Vercel project settings (Production,
   Preview, and Development).
4. Deploy.

The import script is meant to be run locally (or from wherever you keep
the spreadsheets) against the same Supabase project Vercel points to — it's
not part of the build.
