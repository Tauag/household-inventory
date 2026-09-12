# Build tasks

Implements [DESIGN.md](DESIGN.md). Sequential. Ship after T11.

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
