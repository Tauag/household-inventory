-- "Don't reorder" toggle: archives the item automatically once its
-- quantity hits 0, instead of leaving it sitting at 0 forever.

alter table items add column dont_reorder boolean not null default false;

grant insert (dont_reorder) on items to authenticated;
grant update (dont_reorder) on items to authenticated;

create or replace function adjust_quantity(item_id uuid, delta int)
returns items
language plpgsql security definer set search_path = public as $$
declare
  result items;
  new_quantity int;
begin
  if not is_member() then
    raise exception 'not a household member';
  end if;

  select greatest(0, quantity + delta) into new_quantity from items where id = item_id;

  update items
     set quantity          = new_quantity,
         last_restocked_at = case when delta > 0 then now() else last_restocked_at end,
         archived_at       = case
                                when new_quantity = 0 and dont_reorder and archived_at is null
                                then now()
                                else archived_at
                              end
   where id = item_id
  returning * into result;

  return result;
end;
$$;
