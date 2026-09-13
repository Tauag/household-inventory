# Build tasks

Implements [DESIGN.md](DESIGN.md). Sequential.

## T15 Custom subdomain

Point the domain at the Vercel deployment. Manual, in the registrar and Vercel dashboards;
not a code change.

Done when: the app opens at the custom subdomain, not the vercel.app URL.

## T16 Photos

Client-side canvas resize to 512 px long edge, WebP, upload to a private bucket at
`items/<item_id>.webp`. Batch-sign URLs for visible rows, one hour.

Lowest priority: ship everything else first.

Done when: a 4 MB phone photo lands under ~100 KB and an unsigned bucket URL returns 403.
