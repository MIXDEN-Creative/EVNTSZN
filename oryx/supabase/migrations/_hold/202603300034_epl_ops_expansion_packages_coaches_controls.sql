begin;

alter table epl.opportunities
  add column if not exists is_archived boolean not null default false;

alter table epl.sponsor_partners
  add column if not exists is_archived boolean not null default false;

alter table epl.merch_catalog
  add column if not exists is_archived boolean not null default false;

alter table epl.add_on_catalog
  add column if not exists is_archived boolean not null default false;

alter table epl.staff_applications
  add column if not exists is_archived boolean not null default false;

alter table epl.season_staff_assignments
  add column if not exists is_archived boolean not null default false;

create table if not exists epl.sponsorship_packages (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  package_code text not null unique,
  package_name text not null,
  package_type text not null,
  price_floor_cents integer null,
  price_ceiling_cents integer null,
  custom_pricing boolean not null default false,
  summary text not null,
  best_for text null,
  features text[] not null default '{}',
  is_active boolean not null default true,
  is_public boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.sponsor_deliverables (
  id uuid primary key default gen_random_uuid(),
  sponsor_partner_id uuid not null references epl.sponsor_partners(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  deliverable_title text not null,
  deliverable_type text not null,
  due_at timestamptz null,
  completed_at timestamptz null,
  status text not null default 'pending',
  owner_assignment_id uuid null references epl.season_staff_assignments(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_sponsor_deliverables_status
  on epl.sponsor_deliverables(status, due_at);

create table if not exists epl.merch_sales (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  merch_catalog_id uuid not null references epl.merch_catalog(id) on delete cascade,
  game_id uuid null references epl.games(id) on delete set null,
  quantity integer not null default 1,
  gross_amount_cents integer not null default 0,
  cost_amount_cents integer not null default 0,
  sale_channel text not null default 'on_site',
  sold_at timestamptz not null default now(),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_epl_merch_sales_season
  on epl.merch_sales(season_id, sold_at);

create table if not exists epl.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text null,
  coach_type text not null default 'head_coach',
  status text not null default 'active',
  assigned_team_id uuid null references epl.teams(id) on delete set null,
  bio text null,
  years_experience integer null,
  specialties text[] not null default '{}',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_coach_profiles_team
  on epl.coach_profiles(assigned_team_id, status);

insert into epl.staff_roles_catalog (
  role_code, display_name, department, is_essential, default_compensation_tier, default_pay_rate_cents, access_scope, sort_order
)
values
  ('head_coach', 'Head Coach', 'Coaching', true, 'paid', null, '{"coaching":true,"roster":true}'::jsonb, 280),
  ('assistant_coach', 'Assistant Coach', 'Coaching', true, 'incentivized', null, '{"coaching":true,"roster":true}'::jsonb, 290),
  ('offensive_coordinator', 'Offensive Coordinator', 'Coaching', false, 'incentivized', null, '{"coaching":true}'::jsonb, 300),
  ('defensive_coordinator', 'Defensive Coordinator', 'Coaching', false, 'incentivized', null, '{"coaching":true}'::jsonb, 310),
  ('team_manager', 'Team Manager', 'Team Operations', false, 'volunteer', null, '{"team_ops":true}'::jsonb, 320),
  ('equipment_assistant', 'Equipment Assistant', 'Operations', false, 'volunteer', null, '{"ops":true}'::jsonb, 330),
  ('partnerships_coordinator', 'Partnerships Coordinator', 'Revenue', false, 'incentivized', null, '{"sponsors":true}'::jsonb, 340),
  ('merch_associate', 'Merch Associate', 'Revenue', false, 'incentivized', null, '{"merch":true}'::jsonb, 350),
  ('hospitality_coordinator', 'Hospitality Coordinator', 'Guest Experience', false, 'incentivized', null, '{"hospitality":true}'::jsonb, 360),
  ('medical_support', 'Medical Support', 'Safety', true, 'paid', null, '{"safety":true}'::jsonb, 370)
on conflict (role_code) do update
set
  display_name = excluded.display_name,
  department = excluded.department,
  is_essential = excluded.is_essential,
  default_compensation_tier = excluded.default_compensation_tier,
  default_pay_rate_cents = excluded.default_pay_rate_cents,
  access_scope = excluded.access_scope,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into epl.opportunities (
  league_id, season_id, role_code, title, department, opportunity_type, summary, description, requirements, perks, pay_label, status, is_public, display_order
)
select
  l.id,
  null,
  x.role_code,
  x.title,
  x.department,
  x.opportunity_type,
  x.summary,
  x.description,
  x.requirements,
  x.perks,
  x.pay_label,
  'open',
  true,
  x.display_order
from epl.leagues l
cross join (
  values
    ('head_coach','Head Coach','Coaching','paid','Lead one EPL team through the season.','Own team leadership, player development, communication, and game strategy.','{"Leadership","Football knowledge","Reliable communication"}'::text[],'{"Leadership role","Team visibility"}'::text[],'Paid leadership role',140),
    ('assistant_coach','Assistant Coach','Coaching','incentivized','Support a head coach and help run the team.','Help with player readiness, sideline support, and team organization.','{"Football knowledge preferred","Reliable"}'::text[],'{"Coaching pathway","Team access"}'::text[],'Incentivized coaching role',150),
    ('offensive_coordinator','Offensive Coordinator','Coaching','incentivized','Help shape offensive strategy.','Support play design, offensive organization, and player development.','{"Strong football understanding"}'::text[],'{"Strategic role","Coaching growth"}'::text[],'Incentivized coaching role',160),
    ('defensive_coordinator','Defensive Coordinator','Coaching','incentivized','Help lead the defensive side.','Support defensive planning, assignments, and team execution.','{"Strong football understanding"}'::text[],'{"Strategic role","Coaching growth"}'::text[],'Incentivized coaching role',170),
    ('team_manager','Team Manager','Team Operations','volunteer','Keep a team organized behind the scenes.','Handle player comms, logistics, attendance tracking, and support the coaching staff.','{"Highly organized","Reliable"}'::text[],'{"Team access","Leadership pathway"}'::text[],'Volunteer role',180)
) as x(role_code,title,department,opportunity_type,summary,description,requirements,perks,pay_label,display_order)
where l.slug = 'epl'
  and not exists (
    select 1
    from epl.opportunities o
    where o.league_id = l.id
      and o.role_code = x.role_code
      and o.title = x.title
  );

insert into epl.sponsorship_packages (
  league_id,
  package_code,
  package_name,
  package_type,
  price_floor_cents,
  price_ceiling_cents,
  custom_pricing,
  summary,
  best_for,
  features,
  is_active,
  is_public,
  sort_order
)
select
  l.id,
  x.package_code,
  x.package_name,
  x.package_type,
  x.price_floor_cents,
  x.price_ceiling_cents,
  x.custom_pricing,
  x.summary,
  x.best_for,
  x.features,
  true,
  true,
  x.sort_order
from epl.leagues l
cross join (
  values
    (
      'community_partner',
      'Community Partner',
      'non_monetary',
      null,
      null,
      true,
      'Early collaboration through products, venue access, services, cross-promotion, and brand inclusion in event experiences.',
      'Early collaboration and mutual growth',
      '{"Product sponsorship","Venue partnership or space access","Cross-promotion","Brand inclusion in event experiences"}'::text[],
      10
    ),
    (
      'event_partner',
      'Event Partner',
      'event_level',
      25000,
      75000,
      false,
      'On-site brand presence, logo placement, product placement or sampling, and marketing mention for a single event.',
      'Testing EVNTSZN with low commitment',
      '{"On-site brand presence","Logo placement on event promotions","Product placement or sampling","Mention in event marketing"}'::text[],
      20
    ),
    (
      'featured_partner',
      'Featured Partner',
      'premium',
      100000,
      null,
      false,
      'Premium placement across events with stronger brand visibility, custom activations, and priority positioning.',
      'Brands that want to stand out',
      '{"Premium placement across events","Strong brand visibility on marketing","Custom activation opportunities","Priority positioning within experiences"}'::text[],
      30
    ),
    (
      'city_partner',
      'City Partner',
      'city_wide',
      null,
      null,
      true,
      'Presence across multiple events with ongoing brand integration, exclusive category positioning, and long-term collaboration.',
      'Brands building long-term presence',
      '{"Presence across multiple events","Ongoing brand integration","Exclusive category positioning","Long-term collaboration opportunities"}'::text[],
      40
    )
) as x(package_code, package_name, package_type, price_floor_cents, price_ceiling_cents, custom_pricing, summary, best_for, features, sort_order)
where l.slug = 'epl'
on conflict (package_code) do update
set
  package_name = excluded.package_name,
  package_type = excluded.package_type,
  price_floor_cents = excluded.price_floor_cents,
  price_ceiling_cents = excluded.price_ceiling_cents,
  custom_pricing = excluded.custom_pricing,
  summary = excluded.summary,
  best_for = excluded.best_for,
  features = excluded.features,
  is_active = excluded.is_active,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace view public.epl_v_sponsorship_packages as
select
  sp.id,
  sp.package_code,
  sp.package_name,
  sp.package_type,
  sp.price_floor_cents,
  sp.price_ceiling_cents,
  sp.custom_pricing,
  sp.summary,
  sp.best_for,
  sp.features,
  sp.is_active,
  sp.is_public,
  sp.sort_order
from epl.sponsorship_packages sp
where sp.is_public = true
  and sp.is_active = true
order by sp.sort_order asc;

grant select on public.epl_v_sponsorship_packages to anon, authenticated, service_role;

create or replace view public.epl_v_admin_sponsor_deliverables as
select
  d.id,
  s.slug as season_slug,
  sp.company_name,
  d.sponsor_partner_id,
  d.deliverable_title,
  d.deliverable_type,
  d.status,
  d.due_at,
  d.completed_at,
  d.notes,
  d.owner_assignment_id,
  d.created_at,
  d.updated_at
from epl.sponsor_deliverables d
left join epl.seasons s on s.id = d.season_id
join epl.sponsor_partners sp on sp.id = d.sponsor_partner_id
order by d.created_at desc;

grant select on public.epl_v_admin_sponsor_deliverables to authenticated, service_role;

create or replace view public.epl_v_admin_merch_sales as
select
  ms.id,
  s.slug as season_slug,
  mc.sku,
  mc.item_name,
  ms.quantity,
  ms.gross_amount_cents,
  ms.cost_amount_cents,
  (ms.gross_amount_cents - ms.cost_amount_cents) as net_amount_cents,
  ms.sale_channel,
  ms.sold_at,
  ms.notes
from epl.merch_sales ms
left join epl.seasons s on s.id = ms.season_id
join epl.merch_catalog mc on mc.id = ms.merch_catalog_id
order by ms.sold_at desc;

grant select on public.epl_v_admin_merch_sales to authenticated, service_role;

create or replace view public.epl_v_admin_coaches as
select
  cp.id,
  s.slug as season_slug,
  trim(cp.first_name || ' ' || cp.last_name) as coach_name,
  cp.email,
  cp.phone,
  cp.coach_type,
  cp.status,
  cp.assigned_team_id,
  t.display_name as team_name,
  cp.years_experience,
  cp.specialties,
  cp.bio,
  cp.is_archived,
  cp.created_at,
  cp.updated_at
from epl.coach_profiles cp
left join epl.seasons s on s.id = cp.season_id
left join epl.teams t on t.id = cp.assigned_team_id
order by cp.created_at desc;

grant select on public.epl_v_admin_coaches to authenticated, service_role;

commit;
