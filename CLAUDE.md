@AGENTS.md

## Migrations

Supabase CLI, linked to project `lziakqwcjkkksjtvkqip`. New SQL files go in
`supabase/migrations/`, named `supabase migration new <name>` would name them
(timestamp prefix + description).

**Claude writes migration files but never applies them.** The user runs
`supabase db push` themselves after reviewing the SQL. Don't run `db push`,
`db reset`, or paste migration SQL into the Supabase SQL editor on their
behalf.

Migration history lives in two places that must agree:
- the ordered files in `supabase/migrations/` (git, the real source of truth)
- the `supabase_migrations.schema_migrations` table on the remote db (what's
  actually been applied)

`supabase db push` is what keeps them in sync — it applies pending files and
records them in that table. Always use it to apply, even by hand; don't paste
migration SQL directly into the SQL editor, since that changes the schema
without recording it, and `supabase migration list` (local vs. remote) will
then show drift. If SQL ever is run by hand outside the CLI, reconcile with
`supabase migration repair --status applied <timestamp>` right after.

Once a migration has been pushed, don't edit its file. A later change is a
new migration file, so the applied history stays an append-only ledger of
what actually ran.
