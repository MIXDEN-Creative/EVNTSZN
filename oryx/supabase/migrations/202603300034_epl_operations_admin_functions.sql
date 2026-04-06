begin;

create or replace function public.epl_set_player_pipeline_status(
  p_application_id uuid,
  p_application_status text default null,
  p_registration_status text default null,
  p_draft_eligible boolean default null,
  p_player_status text default null,
  p_waived_fee boolean default null
)
returns void
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_registration_id uuid;
begin
  if p_application_status is not null then
    update epl.player_applications
    set
      status = p_application_status,
      reviewed_at = now(),
      updated_at = now()
    where id = p_application_id;
  end if;

  select id into v_registration_id
  from epl.season_registrations
  where application_id = p_application_id
  limit 1;

  if v_registration_id is not null then
    update epl.season_registrations
    set
      registration_status = coalesce(p_registration_status::epl.epl_registration_status, registration_status),
      draft_eligible = coalesce(p_draft_eligible, draft_eligible),
      player_status = coalesce(p_player_status::epl.epl_player_status, player_status),
      waived_fee = coalesce(p_waived_fee, waived_fee),
      updated_at = now()
    where id = v_registration_id;
  end if;
end;
$$;

grant execute on function public.epl_set_player_pipeline_status(uuid, text, text, boolean, text, boolean)
to anon, authenticated, service_role;

create or replace function public.epl_create_staff_assignment(
  p_staff_application_id uuid,
  p_role_id uuid,
  p_compensation_tier text,
  p_pay_rate_cents integer default null,
  p_stipend_cents integer default null,
  p_can_access_admin boolean default false,
  p_can_access_draft_console boolean default false,
  p_can_access_scanner boolean default false,
  p_can_access_finance boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_assignment_id uuid;
  v_league_id uuid;
  v_season_id uuid;
begin
  select league_id, season_id
    into v_league_id, v_season_id
  from epl.staff_applications
  where id = p_staff_application_id
  limit 1;

  insert into epl.season_staff_assignments (
    league_id,
    season_id,
    staff_application_id,
    role_id,
    assignment_status,
    compensation_tier,
    pay_rate_cents,
    stipend_cents,
    can_access_admin,
    can_access_draft_console,
    can_access_scanner,
    can_access_finance
  )
  values (
    v_league_id,
    v_season_id,
    p_staff_application_id,
    p_role_id,
    'assigned',
    p_compensation_tier,
    p_pay_rate_cents,
    p_stipend_cents,
    p_can_access_admin,
    p_can_access_draft_console,
    p_can_access_scanner,
    p_can_access_finance
  )
  returning id into v_assignment_id;

  update epl.staff_applications
  set
    status = 'role_assigned',
    updated_at = now()
  where id = p_staff_application_id;

  return v_assignment_id;
end;
$$;

grant execute on function public.epl_create_staff_assignment(uuid, uuid, text, integer, integer, boolean, boolean, boolean, boolean)
to anon, authenticated, service_role;

create or replace function public.epl_create_opportunity(
  p_role_code text,
  p_title text,
  p_department text,
  p_opportunity_type text,
  p_summary text,
  p_description text,
  p_requirements text[] default '{}',
  p_perks text[] default '{}',
  p_pay_label text default null,
  p_display_order integer default 100
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_id uuid;
  v_league_id uuid;
begin
  select id into v_league_id
  from epl.leagues
  where slug = 'epl'
  limit 1;

  insert into epl.opportunities (
    league_id,
    role_code,
    title,
    department,
    opportunity_type,
    summary,
    description,
    requirements,
    perks,
    pay_label,
    status,
    is_public,
    display_order
  )
  values (
    v_league_id,
    p_role_code,
    p_title,
    p_department,
    p_opportunity_type,
    p_summary,
    p_description,
    coalesce(p_requirements, '{}'),
    coalesce(p_perks, '{}'),
    p_pay_label,
    'open',
    true,
    p_display_order
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_create_opportunity(text, text, text, text, text, text, text[], text[], text, integer)
to anon, authenticated, service_role;

create or replace function public.epl_create_revenue_entry(
  p_season_slug text,
  p_stream_code text,
  p_money_direction text,
  p_amount_cents integer,
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_id uuid;
  v_league_id uuid;
  v_season_id uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  insert into epl.revenue_ledger (
    league_id,
    season_id,
    stream_code,
    money_direction,
    entry_status,
    amount_cents,
    memo
  )
  values (
    v_league_id,
    v_season_id,
    p_stream_code,
    p_money_direction,
    'posted',
    p_amount_cents,
    p_memo
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_create_revenue_entry(text, text, text, integer, text)
to anon, authenticated, service_role;

create or replace function public.epl_create_sponsor_partner(
  p_season_slug text,
  p_company_name text,
  p_contact_name text default null,
  p_contact_email text default null,
  p_package_name text default null,
  p_cash_value_cents integer default 0,
  p_in_kind_value_cents integer default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_id uuid;
  v_league_id uuid;
  v_season_id uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  insert into epl.sponsor_partners (
    league_id,
    season_id,
    company_name,
    contact_name,
    contact_email,
    package_name,
    partner_status,
    cash_value_cents,
    in_kind_value_cents,
    notes
  )
  values (
    v_league_id,
    v_season_id,
    p_company_name,
    p_contact_name,
    p_contact_email,
    p_package_name,
    'lead',
    coalesce(p_cash_value_cents, 0),
    coalesce(p_in_kind_value_cents, 0),
    p_notes
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_create_sponsor_partner(text, text, text, text, text, integer, integer, text)
to anon, authenticated, service_role;

create or replace function public.epl_create_merch_item(
  p_season_slug text,
  p_sku text,
  p_item_name text,
  p_item_type text,
  p_price_cents integer,
  p_cost_cents integer default 0,
  p_inventory_count integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_id uuid;
  v_league_id uuid;
  v_season_id uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  insert into epl.merch_catalog (
    league_id,
    season_id,
    sku,
    item_name,
    item_type,
    price_cents,
    cost_cents,
    inventory_count,
    is_active
  )
  values (
    v_league_id,
    v_season_id,
    p_sku,
    p_item_name,
    p_item_type,
    p_price_cents,
    coalesce(p_cost_cents, 0),
    coalesce(p_inventory_count, 0),
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_create_merch_item(text, text, text, text, integer, integer, integer)
to anon, authenticated, service_role;

create or replace function public.epl_create_add_on(
  p_season_slug text,
  p_code text,
  p_item_name text,
  p_description text default null,
  p_price_cents integer default 0,
  p_fulfillment_type text default 'digital'
)
returns uuid
language plpgsql
security definer
set search_path = public, epl
as $$
declare
  v_id uuid;
  v_league_id uuid;
  v_season_id uuid;
begin
  select l.id, s.id
    into v_league_id, v_season_id
  from epl.seasons s
  join epl.leagues l on l.id = s.league_id
  where l.slug = 'epl'
    and s.slug = p_season_slug
  limit 1;

  insert into epl.add_on_catalog (
    league_id,
    season_id,
    code,
    item_name,
    description,
    price_cents,
    fulfillment_type,
    is_active
  )
  values (
    v_league_id,
    v_season_id,
    p_code,
    p_item_name,
    p_description,
    coalesce(p_price_cents, 0),
    p_fulfillment_type,
    true
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.epl_create_add_on(text, text, text, text, integer, text)
to anon, authenticated, service_role;

create or replace view public.epl_v_staff_roles_catalog as
select
  id,
  role_code,
  display_name,
  department,
  is_essential,
  default_compensation_tier,
  default_pay_rate_cents,
  access_scope,
  sort_order
from epl.staff_roles_catalog
order by sort_order asc, display_name asc;

grant select on public.epl_v_staff_roles_catalog to anon, authenticated, service_role;

create or replace view public.epl_v_sponsor_partners as
select
  sp.id,
  s.slug as season_slug,
  sp.company_name,
  sp.contact_name,
  sp.contact_email,
  sp.package_name,
  sp.partner_status,
  sp.cash_value_cents,
  sp.in_kind_value_cents,
  sp.notes,
  sp.created_at,
  sp.updated_at
from epl.sponsor_partners sp
left join epl.seasons s on s.id = sp.season_id
order by sp.created_at desc;

grant select on public.epl_v_sponsor_partners to anon, authenticated, service_role;

create or replace view public.epl_v_merch_catalog as
select
  mc.id,
  s.slug as season_slug,
  mc.sku,
  mc.item_name,
  mc.item_type,
  mc.price_cents,
  mc.cost_cents,
  mc.inventory_count,
  mc.is_active,
  mc.created_at,
  mc.updated_at
from epl.merch_catalog mc
left join epl.seasons s on s.id = mc.season_id
order by mc.created_at desc;

grant select on public.epl_v_merch_catalog to anon, authenticated, service_role;

create or replace view public.epl_v_add_on_catalog as
select
  ao.id,
  s.slug as season_slug,
  ao.code,
  ao.item_name,
  ao.description,
  ao.price_cents,
  ao.fulfillment_type,
  ao.is_active,
  ao.created_at,
  ao.updated_at
from epl.add_on_catalog ao
left join epl.seasons s on s.id = ao.season_id
order by ao.created_at desc;

grant select on public.epl_v_add_on_catalog to anon, authenticated, service_role;

commit;
