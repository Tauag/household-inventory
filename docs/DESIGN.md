# Household Inventory — System Design

Implements [PRD.md](PRD.md).

## Shape

Next.js (App Router) on Vercel. Supabase project providing Postgres, Auth, and Storage. The browser talks to Supabase directly; row-level security is the authorization boundary. One server route exists, for barcode lookup.

```
Phone (PWA)
  ├── supabase-js ──► Supabase  (Postgres + RLS, Auth, Storage)
  └── /api/barcode/[code] ──► Open Beauty Facts / Open Food Facts
```

### The entire inventory is one client-side array

41 items today, a few hundred at the ceiling. The app loads every non-archived row on mount (roughly 10 KB) and does search, category filtering, and the low-stock list in memory. No server-side search, no pagination, no query layer.

`lazy:` in-memory filtering over the full table. Ceiling is a few thousand items, where initial load starts to feel slow. Upgrade path is a `pg_trgm` index and server-side filtering, which is a change to one fetch function.

Writes go straight to Supabase, then patch the local array. Refetch on window focus to pick up another person's changes.

`lazy:` no Supabase Realtime. Two people editing the same item within seconds of each other is not a real scenario in a 4-person household. Adding it later is a subscription on one table.

## Schema

```sql
create extension if not exists pgcrypto;

create table members (
  email text primary key
);

create table items (
  id                uuid primary key default gen_random_uuid(),
  brand             text,
  name              text not null,
  quantity          int  not null default 0 check (quantity >= 0),
  reorder_at        int  not null default 1 check (reorder_at >= 0),
  category          text,
  location          text,
  barcode           text unique,
  purchase_url      text,
  image_path        text,
  notes             text,
  last_restocked_at timestamptz,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on items (archived_at) where archived_at is null;
```

`brand` is nullable because rows in the source sheet have no brand.

`category` and `location` are free text, not foreign keys. The picker offers existing distinct values from the loaded array and accepts anything new. Two tables and a join buy nothing at this size.

Delete is a soft delete via `archived_at`, so a mis-tap does not destroy an item's barcode binding and purchase link.

### Quantity changes go through an RPC

```sql
create function adjust_quantity(item_id uuid, delta int)
returns items language sql security invoker as $$
  update items
     set quantity          = greatest(0, quantity + delta),
         last_restocked_at = case when delta > 0 then now() else last_restocked_at end,
         updated_at        = now()
   where id = item_id
  returning *;
$$;
```

Arithmetic happens in the database, so two phones decrementing at once cannot lose an update. The client sends a delta, never an absolute count.

`last_restocked_at` is a side effect of restocking rather than a field anyone types. This is the direct fix for the PRD's finding that optional date fields are never filled.

### Row-level security

```sql
alter table items enable row level security;

create policy household_all on items
  for all to authenticated
  using      (exists (select 1 from members where email = auth.jwt()->>'email'))
  with check (exists (select 1 from members where email = auth.jwt()->>'email'));
```

`members` itself is RLS-enabled with no policy, so it is readable only by the service role and by the policy above, which runs as the definer of the check. Adding a household member is one insert from the Supabase dashboard.

A signed-in Google account that is not in `members` sees an empty list from the database. Middleware checks membership on page load so that case renders "you're not on the household list" instead of an empty inventory.

## Auth

Supabase Auth with Google as the only provider. Session in an httpOnly cookie via `@supabase/ssr`, refreshed in Next.js middleware.

No password gate, no shared link. A leaked URL reaches a sign-in screen.

## Barcode

### Scanning

`BarcodeDetector` where the browser has it (Chrome, Android). Everywhere else, lazy-load a WASM decoder (`zxing-wasm`) against a `<video>` frame loop.

Safari has no `BarcodeDetector`, so on iPhone the WASM path is the primary path, not a fallback. It is verified on a real phone. Curved bottles decode, so cylindrical packaging is not the blocker this document expected.

Camera access requires HTTPS, which Vercel provides. `getUserMedia` with `facingMode: 'environment'`.

The decode runs in a Web Worker. `zxing` decodes synchronously, so a frame loop on the main thread stalls the preview and a phone eventually kills the tab. Turbopack does not compile `new Worker(new URL('./x.ts', import.meta.url))`, so the worker ships prebuilt from `public/` and loads zxing's IIFE build with `importScripts`.

Formats are EAN/UPC plus Code 128. Code 128 is not optional, because Amazon FNSKU labels use it.

Verify camera changes on a phone, never a laptop webcam. A webcam resolves the wide bars on US retail boxes but not the narrow ones on small cosmetics packaging.

### Resolving a code

1. Known code: `items.barcode` matches, jump to the item. This is the path for every scan after the first.
2. Unknown code: call `/api/barcode/[code]`, which tries Open Beauty Facts then Open Food Facts (both free, no key, no rate limit worth planning around) and returns brand, name, and image URL if found.
3. Nothing found: open the new-item form with the barcode prefilled and the name blank.

Coverage for K-beauty is poor, so step 3 is the common case on first scan. Amazon FNSKU stickers cover the product's own barcode, so those items scan as a warehouse label no product database knows, which is step 3 again. The lookup is a convenience on top of scan-to-bind, not a dependency. Once bound, the code resolves locally forever.

`lazy:` no cache table for lookup responses. A given barcode is looked up at most once, because success or failure both end in a row with that barcode stored.

`items.barcode` is a single column, so an item sold in two sizes with two codes needs two rows. Upgrade path if that becomes annoying: a `barcodes` child table.

## Images

Optional, one per item. Resize client-side on a canvas to 512 px on the long edge and encode as WebP before upload, so a 4 MB phone photo lands as roughly 60 KB.

Private Storage bucket, path `items/<item_id>.webp`. The app batch-signs URLs for visible rows with `createSignedUrls` (one hour). A private bucket keeps the access story identical to the database: signed in and on the allowlist, or nothing.

## Sheet import

A one-off Node script, run once, not shipped. Reads the exported CSV, maps `Brand Name → brand`, `Product Name → name`, `# Remaining → quantity`, and inserts with the service role key. Blank brand is kept as null. Purchase Link and Last Restocked are empty in the source and are ignored.

Self-check: assert the inserted row count equals the CSV data-row count and that the summed quantity matches the CSV.

## PWA

`manifest.json` with icons and `display: standalone`, plus a service worker that caches the app shell only. No data caching, no background sync. The app requires connectivity per the PRD.

## Cost

$0/month plus the domain. Free tiers: Supabase 500 MB database, 1 GB storage, 50k MAU; Vercel hobby hosting. Expected usage is under 1% of every one of those.

A free Supabase project pauses after a week of no requests. A household using this weekly never hits that. If it does pause, the first visit after unpausing is slow, not broken.

## Build order

1. Supabase project, schema, RLS, Google provider, allowlist rows.
2. Next.js shell, sign-in, middleware membership check.
3. Item list with search, category filter, and the decrement control. This is the whole product; everything after it is an accelerant.
4. Sheet import, run once.
5. Add, edit, restock, low-stock list.
6. Barcode scan and bind. The WASM decoder is verified; see Scanning.
7. Barcode lookup route.
8. Photos.
9. PWA manifest, custom subdomain.

Ship after step 5. Steps 6 through 9 are real improvements but the app is usable and better than the sheet without them.
