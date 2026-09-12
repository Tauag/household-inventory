# Household Inventory

A phone-first inventory tracker for one household. Search, decrement, and
restock items instead of maintaining a spreadsheet.

See [docs/PRD.md](docs/PRD.md) for the problem and [docs/DESIGN.md](docs/DESIGN.md)
for the system design. [docs/TASKS.md](docs/TASKS.md) tracks build order.

## Stack

Next.js (App Router) on Vercel. Supabase for Postgres, Auth, and Storage. The
browser talks to Supabase directly with row-level security.

## Setup

Use the Node version in `.nvmrc`:

```bash
nvm use
npm install
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Get both from the Supabase project dashboard (Settings → API).

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the
household Google account; only emails in the `members` table get past the
allowlist.

## Database

The Supabase CLI is linked to the project. New schema changes go in
`supabase/migrations/` as new files; run `supabase db push` yourself after
reviewing the SQL. See [CLAUDE.md](CLAUDE.md) for the full migration workflow.

## Tests

Plain `node:assert` scripts, no test runner for now:

```bash
node lib/supabase/route-decision.test.mjs
```
