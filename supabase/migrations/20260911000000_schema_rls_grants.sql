-- T1: schema, RLS, grants. See TASKS.md and DESIGN.md.

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

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

-- security definer: a policy subquery on members would otherwise be denied by
-- members' own RLS (it has no policies of its own).
create function is_member() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from members where email = auth.jwt()->>'email');
$$;

alter table members enable row level security;
-- No policies: members is readable only via is_member() (security definer)
-- and the service role. The client never queries it directly.

alter table items enable row level security;

create policy household_all on items
  for all to authenticated
  using (is_member())
  with check (is_member());

-- Column grants. `quantity` and `last_restocked_at` are writable only through
-- adjust_quantity(); `id`, `created_at`, `updated_at` are never client-writable.
-- No delete grant: removal is the archived_at soft delete below.
revoke all on items from authenticated;
grant select on items to authenticated;
grant insert (
  brand, name, reorder_at, category, location,
  barcode, purchase_url, image_path, notes
) on items to authenticated;
grant update (
  brand, name, reorder_at, category, location,
  barcode, purchase_url, image_path, notes, archived_at
) on items to authenticated;

create function adjust_quantity(item_id uuid, delta int)
returns items
language plpgsql security definer set search_path = public as $$
declare
  result items;
begin
  if not is_member() then
    raise exception 'not a household member';
  end if;

  update items
     set quantity          = greatest(0, quantity + delta),
         last_restocked_at = case when delta > 0 then now() else last_restocked_at end
   where id = item_id
  returning * into result;

  return result;
end;
$$;

revoke execute on function adjust_quantity(uuid, int) from public;
grant execute on function adjust_quantity(uuid, int) to authenticated;
