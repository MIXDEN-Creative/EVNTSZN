-- Seed core module entitlements for internal MIXDEN org
-- Creates org if missing and enables modules.

do $$
declare
  mixden_org_id uuid;
begin
  select id into mixden_org_id
from public.organizations
where name='MIXDEN Creative' and is_internal=true
order by created_at asc
limit 1;

if mixden_org_id is null then
  raise exception 'Internal org "MIXDEN Creative" not found. Seed org first.';
end if;

  insert into public.org_entitlements (org_id, module_key, enabled, source)
  values
    (mixden_org_id,'messaging', true, 'seed'),
    (mixden_org_id,'events',    true, 'seed'),
    (mixden_org_id,'venues',    true, 'seed'),
    (mixden_org_id,'music',     true, 'seed'),
    (mixden_org_id,'finance',   true, 'seed')
  on conflict (org_id, module_key)
  do update set enabled = excluded.enabled, source = excluded.source;
end $$;
