-- Adds an `is_member` boolean claim to every access token so the proxy can
-- skip the is_member() RPC. Enable in Dashboard: Authentication > Hooks.
-- security definer: reads members (RLS on, no policies) without a grant to
-- supabase_auth_admin.
create function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  claims jsonb := event->'claims';
begin
  claims := jsonb_set(
    claims,
    '{is_member}',
    to_jsonb(exists (select 1 from members where email = claims->>'email'))
  );
  return jsonb_set(event, '{claims}', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
