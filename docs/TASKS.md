# Build tasks

Implements [DESIGN.md](DESIGN.md). Sequential. Ship after T11.

## T13 Scan to resolve and bind

Known code jumps to the item. Unknown code opens the new-item form with the barcode
prefilled.

Done when: a bound code resolves locally with no network call.

## T14 Barcode lookup route

`/api/barcode/[code]`, tries Open Beauty Facts, returns brand, name, image URL. Anon key
only, never the service role key.

Done when: a miss still lands on the prefilled form rather than an error.

## T15 PWA and subdomain

`manifest.json`, icons, `display: standalone`, service worker caching the app shell only.
Custom subdomain.

Done when: the app installs to a phone home screen and opens without browser chrome.

## T16 Photos

Client-side canvas resize to 512 px long edge, WebP, upload to a private bucket at
`items/<item_id>.webp`. Batch-sign URLs for visible rows, one hour.

Lowest priority: ship everything else first.

Done when: a 4 MB phone photo lands under ~100 KB and an unsigned bucket URL returns 403.
