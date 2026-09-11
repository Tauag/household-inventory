# Household Apps — Infrastructure Plan

## Overview
Two separate web apps, kept fully isolated from each other, hosted under one personal domain via subdomains, running entirely on free tiers.

| | Inventory Tool | Otherscape Sheet Tool |
|---|---|---|
| **Audience** | Household only | Friends |
| **Access model** | Private link / shared password (no real accounts needed) | Per-user login (e.g. Discord or Google via Supabase Auth) |
| **Backend** | Turso (hosted SQLite) *or* its own Supabase project | Supabase (Postgres + built-in auth) |
| **Frontend hosting** | Vercel or Netlify (free tier) | Vercel or Netlify (free tier) |
| **Subdomain** | `inventory.yourdomain.com` | `sheets.yourdomain.com` |

## Key Decisions

1. **Separate backends, not a shared one.** Each app gets its own database and its own API keys. Friends invited to the sheet tool have no path to the inventory data — there's no shared login pool or shared server to misconfigure.

2. **Same domain, different subdomains.** Buying one domain (~$10–15/year) and pointing two subdomains at two separate deployments gives a unified feel without merging the apps. This is simpler and safer than trying to host both under path-based routing (e.g. `/inventory` and `/sheets`) on a single deployment, which would require rewrites/proxying or a shared codebase.

3. **Auth only where it's actually needed.** The inventory tool has no multi-user editing conflicts to worry about, so a private link is enough. The sheet tool needs real accounts so friends don't overwrite each other's characters — Supabase's built-in auth (including Discord login) handles this without custom backend work.

4. **Cost target: $0/month.**
   - Supabase free tier: 500 MB DB, 1 GB file storage, 50k MAUs, unlimited API requests (free projects pause after 1 week of inactivity — not a concern with regular use).
   - Turso free tier: 9 GB storage, 1B row reads, 25M row writes/month — comfortably covers a household inventory list.
   - Vercel/Netlify free tier covers hosting both frontends.
   - Only real cost: the domain name itself.

## Next Steps
- [ ] Buy domain (Porkbun, Namecheap, etc.)
- [ ] Set up two backend projects (Turso/Supabase for inventory, Supabase for sheet tool)
- [ ] Deploy two frontends to Vercel/Netlify
- [ ] Point subdomains at each deployment via DNS
- [ ] Set up Discord/Google login for the sheet tool
