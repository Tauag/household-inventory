# Build tasks

Implements [DESIGN.md](DESIGN.md). Sequential. Ship after T11.

## T1 Schema, RLS, grants

Single migration: extensions, `members`, `items`, partial index, `updated_at` trigger,
`is_member()`, policy, column grants, `adjust_quantity`.

Uses the corrected authorization from review, not the version currently in DESIGN.md:
`is_member()` is `security definer` (a policy subquery on `members` is otherwise
denied by members' own RLS), `adjust_quantity` is `security definer` with an explicit
`is_member()` guard, and column grants keep the client out of `quantity`, `id`,
`created_at`, and `updated_at`.

Done when:
- A member's anon-key client reads all rows; a signed-in non-member reads zero.
- A direct `update items set quantity = 99` from the client is rejected.
- A direct `delete from items` from the client is rejected.
- `adjust_quantity(id, -1)` on a row at 0 leaves it at 0.
- `adjust_quantity(id, +1)` sets `last_restocked_at`; a negative delta does not.

## T2 Auth provider and allowlist

Google as the only provider in Supabase Auth. Insert household emails into `members`.

Done when: Google sign-in returns a session; `auth.jwt()->>'email'` matches a `members` row.

## T3 App shell, sign-in, membership middleware

Next.js App Router on Vercel. `@supabase/ssr` with the session in an httpOnly cookie,
refreshed in middleware. Middleware checks membership.

Done when:
- Signed out, any route renders the sign-in screen.
- Signed in but not in `members`, the app renders "you're not on the household list"
  rather than an empty inventory.
- A session survives a refresh and a cold open.

## T4 Item list

Fetch every non-archived row on mount into one array. Render brand, name, quantity.
Refetch on window focus.

Done when: 41 rows render on a phone viewport; switching tabs and back picks up another
device's change.

## T5 Search and filter

In-memory substring match over brand and name, case- and space-insensitive. Category
filter from distinct values in the loaded array.

Done when: "atobarrier" matches "Aestura Atobarrier 365 Cream"; "aestura ato" matches it too.

## T6 Decrement

One tap, no confirmation. Calls `adjust_quantity(id, -1)`, patches the local array from
the returned row.

Done when: PRD core flow 1 holds, app open to decremented in one search plus one tap,
and two phones decrementing the same item concurrently land at -2, not -1.

## T7 Sheet import

One-off Node script, service role key, not shipped. Maps Brand Name, Product Name,
`# Remaining`. Blank brand stays null. Purchase Link and Last Restocked ignored.

Done when: the script's own asserts pass, inserted row count equals CSV data rows and
summed quantity equals the CSV sum.

## T8 Add item

Form with brand, name, quantity, reorder point, category, location, purchase URL, notes.
Category and location are free-text pickers offering existing distinct values.

Done when: a new item with a blank brand saves; a new category typed by hand appears in
the picker afterward.

## T9 Edit and archive

Edit the same fields. Delete sets `archived_at`.

Done when: an archived item leaves the list and its barcode stays bound in the database.

## T10 Restock

Increment control, and a path that updates several items in one sitting without
re-navigating between each.

Done when: PRD core flow 3 holds, and `last_restocked_at` is set without anyone typing a date.

## T11 Low stock list

Single in-memory list of items where `quantity <= reorder_at`. Purchase URL opens in a
new tab when present; brand and name are enough when it is absent.

Done when: PRD core flow 4 holds.

**Ship here.** Everything below is an accelerant.

## T12 Barcode decode spike

`BarcodeDetector` where available, `zxing-wasm` against a `<video>` frame loop everywhere
else. If the household is iPhone-heavy the WASM path is the primary path.

Test on a real phone, with a real curved bottle, under bathroom lighting, before building
T13 or T14.

Done when: decode rate on cylindrical packaging is known. If it is unusable, T13 and T14
are cut and search plus photos carry identification.

## T13 Scan to resolve and bind

Known code jumps to the item. Unknown code opens the new-item form with the barcode
prefilled.

Done when: a bound code resolves locally with no network call.

## T14 Barcode lookup route

`/api/barcode/[code]`, tries Open Beauty Facts then Open Food Facts, returns brand, name,
image URL. Anon key only, never the service role key.

Done when: a miss still lands on the prefilled form rather than an error.

## T15 Photos

Client-side canvas resize to 512 px long edge, WebP, upload to a private bucket at
`items/<item_id>.webp`. Batch-sign URLs for visible rows, one hour.

Done when: a 4 MB phone photo lands under ~100 KB and an unsigned bucket URL returns 403.

## T16 PWA and subdomain

`manifest.json`, icons, `display: standalone`, service worker caching the app shell only.
Custom subdomain.

Done when: the app installs to a phone home screen and opens without browser chrome.
