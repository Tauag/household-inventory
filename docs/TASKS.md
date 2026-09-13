# Build tasks

Implements [DESIGN.md](DESIGN.md). Sequential. Ship after T11.

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
