-- Self-check for T1. Run against a database with the migration applied:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/t1_check.sql
-- Wrapped in a transaction that always rolls back, so it's safe to re-run.

begin;

insert into members (email) values ('member@example.com');
insert into items (id, brand, name, quantity)
  values ('00000000-0000-0000-0000-000000000001', 'Aestura', 'Atobarrier 365 Cream', 0);

-- A member's client reads all rows.
set local role authenticated;
set local request.jwt.claims = '{"email":"member@example.com"}';
do $$
begin
  if (select count(*) from items) <> 1 then
    raise exception 't1 check failed: member did not see the row';
  end if;
end $$;

-- A signed-in non-member reads zero.
set local request.jwt.claims = '{"email":"stranger@example.com"}';
do $$
begin
  if (select count(*) from items) <> 0 then
    raise exception 't1 check failed: non-member saw a row';
  end if;
end $$;
set local request.jwt.claims = '{"email":"member@example.com"}';

-- A direct quantity write is rejected (column grant, not RLS).
do $$
begin
  update items set quantity = 99 where id = '00000000-0000-0000-0000-000000000001';
  raise exception 't1 check failed: direct quantity update was not rejected';
exception
  when insufficient_privilege then null;
end $$;

-- A direct delete is rejected.
do $$
begin
  delete from items where id = '00000000-0000-0000-0000-000000000001';
  raise exception 't1 check failed: direct delete was not rejected';
exception
  when insufficient_privilege then null;
end $$;

-- adjust_quantity(id, -1) on a row at 0 leaves it at 0, and does not touch last_restocked_at.
do $$
declare
  r items;
begin
  r := adjust_quantity('00000000-0000-0000-0000-000000000001', -1);
  if r.quantity <> 0 then
    raise exception 't1 check failed: decrement below 0 gave %', r.quantity;
  end if;
  if r.last_restocked_at is not null then
    raise exception 't1 check failed: negative delta set last_restocked_at';
  end if;
end $$;

-- adjust_quantity(id, +1) sets last_restocked_at.
do $$
declare
  r items;
begin
  r := adjust_quantity('00000000-0000-0000-0000-000000000001', 1);
  if r.quantity <> 1 then
    raise exception 't1 check failed: increment gave %', r.quantity;
  end if;
  if r.last_restocked_at is null then
    raise exception 't1 check failed: positive delta did not set last_restocked_at';
  end if;
end $$;

reset role;
rollback;

select 't1 checks passed' as result;
