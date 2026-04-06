begin;

create or replace view public.epl_v_admin_applications as
select *
from epl.v_admin_applications;

create or replace function public.approve_epl_application(
  p_application_id uuid,
  p_approved_by uuid default null
)
returns void
language sql
security definer
set search_path = public, epl
as $$
  select epl.approve_application(p_application_id, p_approved_by);
$$;

create or replace function public.waitlist_epl_application(
  p_application_id uuid,
  p_reviewed_by uuid default null
)
returns void
language sql
security definer
set search_path = public, epl
as $$
  select epl.waitlist_application(p_application_id, p_reviewed_by);
$$;

create or replace function public.decline_epl_application(
  p_application_id uuid,
  p_reviewed_by uuid default null
)
returns void
language sql
security definer
set search_path = public, epl
as $$
  select epl.decline_application(p_application_id, p_reviewed_by);
$$;

grant select on public.epl_v_admin_applications to anon, authenticated, service_role;
grant execute on function public.approve_epl_application(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.waitlist_epl_application(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.decline_epl_application(uuid, uuid) to anon, authenticated, service_role;

commit;
