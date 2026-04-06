begin;

create table if not exists epl.staff_roles_catalog (
  id uuid primary key default gen_random_uuid(),
  role_code text not null unique,
  display_name text not null,
  department text not null,
  is_essential boolean not null default false,
  default_compensation_tier text not null default 'volunteer',
  default_pay_rate_cents integer null,
  access_scope jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.staff_applications (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  opportunity_id uuid null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text null,
  city text null,
  state text null,
  preferred_roles text[] not null default '{}',
  experience_summary text null,
  availability_summary text null,
  why_join text null,
  status text not null default 'submitted',
  source text not null default 'evntszn_public_page',
  internal_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_staff_applications_season_status
  on epl.staff_applications(season_id, status);

create table if not exists epl.season_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid not null references epl.seasons(id) on delete cascade,
  staff_application_id uuid null references epl.staff_applications(id) on delete set null,
  assigned_user_id uuid null,
  role_id uuid not null references epl.staff_roles_catalog(id) on delete restrict,
  assignment_status text not null default 'assigned',
  compensation_tier text not null default 'volunteer',
  pay_rate_cents integer null,
  stipend_cents integer null,
  bonus_rules jsonb not null default '{}'::jsonb,
  access_scope jsonb not null default '{}'::jsonb,
  reporting_to_assignment_id uuid null references epl.season_staff_assignments(id) on delete set null,
  can_access_admin boolean not null default false,
  can_access_draft_console boolean not null default false,
  can_access_scanner boolean not null default false,
  can_access_finance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_staff_assignments_season_status
  on epl.season_staff_assignments(season_id, assignment_status);

create table if not exists epl.opportunities (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  role_code text not null,
  title text not null,
  department text not null,
  opportunity_type text not null,
  summary text not null,
  description text not null,
  requirements text[] not null default '{}',
  perks text[] not null default '{}',
  pay_label text null,
  status text not null default 'open',
  is_public boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_opportunities_public
  on epl.opportunities(is_public, status, display_order);

create table if not exists epl.revenue_streams_catalog (
  id uuid primary key default gen_random_uuid(),
  stream_code text not null unique,
  display_name text not null,
  money_direction text not null default 'in',
  sort_order integer not null default 100
);

create table if not exists epl.revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  game_id uuid null references epl.games(id) on delete set null,
  stream_code text not null,
  money_direction text not null,
  entry_status text not null default 'pending',
  amount_cents integer not null default 0,
  memo text null,
  related_entity_type text null,
  related_entity_id uuid null,
  created_by_user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_epl_revenue_ledger_season_stream
  on epl.revenue_ledger(season_id, stream_code, money_direction);

create table if not exists epl.sponsor_partners (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  company_name text not null,
  contact_name text null,
  contact_email text null,
  package_name text null,
  partner_status text not null default 'lead',
  cash_value_cents integer not null default 0,
  in_kind_value_cents integer not null default 0,
  deliverables jsonb not null default '[]'::jsonb,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.merch_catalog (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  sku text not null unique,
  item_name text not null,
  item_type text not null,
  price_cents integer not null,
  cost_cents integer not null default 0,
  inventory_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.add_on_catalog (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references epl.leagues(id) on delete cascade,
  season_id uuid null references epl.seasons(id) on delete set null,
  code text not null unique,
  item_name text not null,
  description text null,
  price_cents integer not null default 0,
  fulfillment_type text not null default 'digital',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into epl.revenue_streams_catalog (stream_code, display_name, money_direction, sort_order)
values
  ('ticketing', 'Ticketing', 'in', 10),
  ('merch', 'Merch', 'in', 20),
  ('sponsors', 'Sponsors', 'in', 30),
  ('add_ons', 'Add-ons', 'in', 40),
  ('staff_pay', 'Staff Pay', 'out', 50),
  ('operations', 'Operations', 'out', 60)
on conflict (stream_code) do update
set
  display_name = excluded.display_name,
  money_direction = excluded.money_direction,
  sort_order = excluded.sort_order;

insert into epl.staff_roles_catalog (
  role_code, display_name, department, is_essential, default_compensation_tier, default_pay_rate_cents, access_scope, sort_order
)
values
  ('commissioner', 'Commissioner', 'Leadership', true, 'paid', null, '{"admin":true,"draft":true,"finance":true}'::jsonb, 10),
  ('deputy_commissioner', 'Deputy Commissioner', 'Leadership', true, 'paid', null, '{"admin":true,"draft":true}'::jsonb, 20),
  ('league_operations_director', 'League Operations Director', 'Operations', true, 'paid', null, '{"admin":true,"ops":true}'::jsonb, 30),
  ('draft_commissioner', 'Draft Commissioner', 'Draft', true, 'paid', null, '{"draft":true}'::jsonb, 40),
  ('player_personnel_director', 'Player Personnel Director', 'Personnel', true, 'paid', null, '{"admin":true,"player_pipeline":true}'::jsonb, 50),
  ('staff_coordinator', 'Staff Coordinator', 'Staffing', true, 'paid', null, '{"admin":true,"staff_pipeline":true}'::jsonb, 60),
  ('ticketing_manager', 'Ticketing Manager', 'Revenue', true, 'paid', null, '{"ticketing":true}'::jsonb, 70),
  ('merch_manager', 'Merch Manager', 'Revenue', true, 'paid', null, '{"merch":true}'::jsonb, 80),
  ('sponsorship_manager', 'Sponsorship Manager', 'Revenue', true, 'paid', null, '{"sponsors":true}'::jsonb, 90),
  ('game_day_ops_lead', 'Game Day Operations Lead', 'Operations', true, 'paid', null, '{"ops":true}'::jsonb, 100),
  ('field_ops', 'Field Operations', 'Operations', true, 'incentivized', null, '{"ops":true}'::jsonb, 110),
  ('check_in_lead', 'Check-In Lead', 'Guest Experience', true, 'paid', null, '{"scanner":true}'::jsonb, 120),
  ('check_in_staff', 'Check-In Staff', 'Guest Experience', false, 'incentivized', null, '{"scanner":true}'::jsonb, 130),
  ('scorekeeper', 'Scorekeeper', 'Game Staff', true, 'paid', null, '{"stats":true}'::jsonb, 140),
  ('stat_keeper', 'Stat Keeper', 'Game Staff', true, 'incentivized', null, '{"stats":true}'::jsonb, 150),
  ('referee', 'Referee', 'Game Staff', true, 'paid', null, '{"game_staff":true}'::jsonb, 160),
  ('content_lead', 'Content Lead', 'Content', true, 'paid', null, '{"content":true}'::jsonb, 170),
  ('photographer', 'Photographer', 'Content', false, 'incentivized', null, '{"content":true}'::jsonb, 180),
  ('videographer', 'Videographer', 'Content', false, 'incentivized', null, '{"content":true}'::jsonb, 190),
  ('social_media_runner', 'Social Media Runner', 'Content', false, 'volunteer', null, '{"content":true}'::jsonb, 200),
  ('livestream_operator', 'Livestream Operator', 'Production', true, 'paid', null, '{"production":true}'::jsonb, 210),
  ('dj_music_coordinator', 'DJ / Music Coordinator', 'Production', false, 'incentivized', null, '{"production":true}'::jsonb, 220),
  ('hospitality_runner', 'Hospitality Runner', 'Guest Experience', false, 'volunteer', null, '{"hospitality":true}'::jsonb, 230),
  ('street_team', 'Street Team', 'Growth', false, 'incentivized', null, '{"growth":true}'::jsonb, 240),
  ('volunteer', 'General Volunteer', 'Volunteer', false, 'volunteer', null, '{"basic":true}'::jsonb, 250),
  ('security_coordinator', 'Security Coordinator', 'Safety', true, 'paid', null, '{"safety":true}'::jsonb, 260),
  ('equipment_manager', 'Equipment Manager', 'Operations', true, 'paid', null, '{"ops":true}'::jsonb, 270)
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
    ('commissioner','Commissioner','Leadership','paid','Lead league-wide strategy and final decision-making.','Oversee EPL league operations, staffing, game-day standards, and long-term direction.','{"Leadership experience","High accountability","Operations mindset"}'::text[],'{"Executive access","Core leadership role"}'::text[],'Essential leadership compensation',10),
    ('deputy_commissioner','Deputy Commissioner','Leadership','paid','Support league leadership and execution.','Help manage league office operations, staff oversight, and major event execution.','{"Leadership experience","Strong communication"}'::text[],'{"Leadership pathway","Core access"}'::text[],'Essential leadership compensation',20),
    ('game_day_ops_lead','Game Day Operations Lead','Operations','paid','Run game-day flow on site.','Own run-of-show, field timing, transitions, and issue resolution on game day.','{"Game-day experience preferred","Calm under pressure"}'::text[],'{"Priority operations role"}'::text[],'Paid essential role',30),
    ('check_in_staff','Check-In Staff','Guest Experience','incentivized','Welcome fans and staff into the experience.','Handle entry, scanning, guest flow, and front-gate support.','{"Reliable","Friendly","Detail-oriented"}'::text[],'{"Perks","Meals","Event access"}'::text[],'Incentivized role',40),
    ('photographer','Photographer','Content','incentivized','Capture the energy of EPL.','Shoot pregame, game action, crowd moments, and postgame content for EPL media.','{"Portfolio preferred","Own equipment helpful"}'::text[],'{"Content credit","Access","Networking"}'::text[],'Incentivized role',50),
    ('videographer','Videographer','Content','incentivized','Tell the story of EPL on video.','Capture cinematic coverage, interviews, social clips, and recap edits.','{"Portfolio preferred","Own equipment helpful"}'::text[],'{"Content credit","Access","Networking"}'::text[],'Incentivized role',60),
    ('social_media_runner','Social Media Runner','Content','volunteer','Help EPL show up online in real time.','Post stories, capture quick updates, and support content publishing on event days.','{"Fast communicator","Comfortable on phone"}'::text[],'{"Experience","Access","Resume credit"}'::text[],'Volunteer role',70),
    ('street_team','Street Team','Growth','incentivized','Help EPL grow in the city.','Promote games, pass out flyers, recruit attendees, and spread awareness.','{"Outgoing personality","Reliable"}'::text[],'{"Perks","Priority opportunities","Networking"}'::text[],'Incentivized role',80),
    ('volunteer','General Volunteer','Volunteer','volunteer','Help wherever EPL needs support.','Flexible volunteer support across guest flow, setup, hospitality, and event operations.','{"Reliable","Helpful attitude"}'::text[],'{"Access","Experience","Team involvement"}'::text[],'Volunteer role',90),
    ('referee','Referee','Game Staff','paid','Officiate EPL games with professionalism.','Manage gameplay fairly and keep the competition organized and safe.','{"Flag football rules knowledge preferred"}'::text[],'{"Core game-day role"}'::text[],'Paid essential role',100),
    ('scorekeeper','Scorekeeper','Game Staff','paid','Track scoring and official game flow.','Maintain official score records and support postgame reporting.','{"Detail-oriented","Game focus"}'::text[],'{"Core game-day role"}'::text[],'Paid essential role',110),
    ('sponsorship_manager','Sponsorship Manager','Revenue','paid','Help secure league growth partners.','Support sponsor outreach, partner servicing, and activation planning.','{"Sales or partnership experience preferred"}'::text[],'{"Revenue-side exposure","Leadership pathway"}'::text[],'Paid essential role',120),
    ('merch_manager','Merch Manager','Revenue','paid','Run EPL merchandise operations.','Own merch setup, inventory, and sales flow during events and campaigns.','{"Retail or inventory mindset preferred"}'::text[],'{"Revenue-side role"}'::text[],'Paid essential role',130)
) as x(role_code,title,department,opportunity_type,summary,description,requirements,perks,pay_label,display_order)
where l.slug = 'epl'
  and not exists (
    select 1
    from epl.opportunities o
    where o.league_id = l.id
      and o.role_code = x.role_code
      and o.title = x.title
  );

create or replace view epl.v_player_pipeline as
select
  s.slug as season_slug,
  pa.id as application_id,
  pa.player_profile_id,
  coalesce(trim(pp.first_name || ' ' || pp.last_name), trim(pa.first_name || ' ' || pa.last_name)) as player_name,
  coalesce(pp.email, pa.email) as email,
  pa.status as application_status,
  sr.registration_status,
  sr.payment_amount_cents,
  sr.waived_fee,
  sr.draft_eligible,
  sr.player_status,
  sr.team_id,
  case
    when pa.status = 'submitted' then 'submission'
    when pa.status in ('approved','waitlisted','declined') and sr.id is null then 'approval'
    when sr.registration_status in ('pending_payment','approved') and coalesce(sr.payment_amount_cents,0) > 0 and sr.paid_at is null and coalesce(sr.waived_fee,false) = false then 'payment'
    when sr.draft_eligible = true then 'draft_pool'
    else 'processing'
  end as pipeline_stage,
  pa.submitted_at,
  sr.updated_at as registration_updated_at
from epl.player_applications pa
left join epl.player_profiles pp on pp.id = pa.player_profile_id
left join epl.season_registrations sr on sr.application_id = pa.id
left join epl.seasons s on s.id = pa.season_id;

create or replace view public.epl_v_player_pipeline as
select * from epl.v_player_pipeline;

create or replace view epl.v_staff_pipeline as
select
  s.slug as season_slug,
  sa.id as staff_application_id,
  trim(sa.first_name || ' ' || sa.last_name) as applicant_name,
  sa.email,
  sa.status as application_status,
  sa.preferred_roles,
  ssa.id as assignment_id,
  src.display_name as assigned_role,
  ssa.assignment_status,
  ssa.compensation_tier,
  case
    when ssa.id is null then 'application'
    when ssa.id is not null and ssa.assignment_status in ('assigned','active') then 'role_assigned'
    else 'processing'
  end as pipeline_stage,
  sa.created_at
from epl.staff_applications sa
left join epl.seasons s on s.id = sa.season_id
left join epl.season_staff_assignments ssa on ssa.staff_application_id = sa.id
left join epl.staff_roles_catalog src on src.id = ssa.role_id;

create or replace view public.epl_v_staff_pipeline as
select * from epl.v_staff_pipeline;

create or replace view epl.v_revenue_pipeline_summary as
select
  s.slug as season_slug,
  rl.stream_code,
  sum(case when rl.money_direction = 'in' then rl.amount_cents else 0 end) as total_money_in_cents,
  sum(case when rl.money_direction = 'out' then rl.amount_cents else 0 end) as total_money_out_cents,
  sum(case when rl.money_direction = 'in' then rl.amount_cents else -rl.amount_cents end) as net_cents,
  count(*) as entry_count
from epl.revenue_ledger rl
left join epl.seasons s on s.id = rl.season_id
group by s.slug, rl.stream_code;

create or replace view public.epl_v_revenue_pipeline_summary as
select * from epl.v_revenue_pipeline_summary;

create or replace view public.epl_v_public_opportunities as
select
  id,
  role_code,
  title,
  department,
  opportunity_type,
  summary,
  description,
  requirements,
  perks,
  pay_label,
  display_order
from epl.opportunities
where is_public = true
  and status = 'open'
order by display_order asc, created_at asc;

grant select on public.epl_v_public_opportunities to anon, authenticated, service_role;
grant select on public.epl_v_player_pipeline to authenticated, service_role;
grant select on public.epl_v_staff_pipeline to authenticated, service_role;
grant select on public.epl_v_revenue_pipeline_summary to authenticated, service_role;

commit;
