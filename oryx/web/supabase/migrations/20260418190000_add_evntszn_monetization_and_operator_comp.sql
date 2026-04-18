alter table public.evntszn_venues
  add column if not exists plan_key text not null default 'venue_free'
    check (plan_key in ('venue_free', 'venue_pro', 'venue_pro_reserve')),
  add column if not exists smart_fill_add_on_active boolean not null default false,
  add column if not exists plan_status text not null default 'active'
    check (plan_status in ('lead', 'active', 'paused', 'inactive', 'canceled')),
  add column if not exists link_plan_override text
    check (link_plan_override in ('link_free', 'link_pro'));

alter table public.evntszn_reserve_venues
  add column if not exists plan_key text not null default 'reserve_standalone'
    check (plan_key in ('reserve_standalone', 'venue_pro_reserve')),
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('lead', 'active', 'paused', 'inactive', 'canceled')),
  add column if not exists capacity_snapshot integer;

alter table public.evntszn_link_pages
  add column if not exists billing_plan_key text not null default 'link_free'
    check (billing_plan_key in ('link_free', 'link_pro'));

alter table public.evntszn_sponsor_accounts
  add column if not exists billing_plan_key text
    check (billing_plan_key in ('sponsor_pro', 'sponsor_elite'));

create table if not exists public.evntszn_account_attributions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  source_type text not null,
  source_id text not null,
  created_by_user_id uuid,
  assigned_to_user_id uuid,
  account_owner_user_id uuid,
  active_status text not null default 'active'
    check (active_status in ('lead', 'active', 'paused', 'inactive', 'archived')),
  attribution_started_at timestamptz not null default timezone('utc', now()),
  attribution_ended_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_type, source_id)
);

create index if not exists evntszn_account_attributions_owner_idx
  on public.evntszn_account_attributions (account_owner_user_id, active_status, updated_at desc);

create index if not exists evntszn_account_attributions_assignment_idx
  on public.evntszn_account_attributions (assigned_to_user_id, active_status, updated_at desc);

drop trigger if exists evntszn_account_attributions_set_updated_at on public.evntszn_account_attributions;
create trigger evntszn_account_attributions_set_updated_at
before update on public.evntszn_account_attributions
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_compensation_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  slug text not null unique,
  label text not null,
  description text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'inactive', 'archived')),
  scope_type text not null default 'default'
    check (scope_type in ('default', 'role', 'user')),
  is_default boolean not null default false,
  rules_json jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists evntszn_compensation_plans_set_updated_at on public.evntszn_compensation_plans;
create trigger evntszn_compensation_plans_set_updated_at
before update on public.evntszn_compensation_plans
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_compensation_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null,
  compensation_plan_id uuid not null references public.evntszn_compensation_plans(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  is_primary boolean not null default false,
  effective_starts_at timestamptz not null default timezone('utc', now()),
  effective_ends_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_comp_plan_assignments_user_idx
  on public.evntszn_compensation_plan_assignments (user_id, status, effective_starts_at desc);

drop trigger if exists evntszn_compensation_plan_assignments_set_updated_at on public.evntszn_compensation_plan_assignments;
create trigger evntszn_compensation_plan_assignments_set_updated_at
before update on public.evntszn_compensation_plan_assignments
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_revenue_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  source_type text not null,
  source_id text not null,
  event_type text not null,
  gross_amount numeric(10,2) not null default 0,
  net_amount numeric(10,2),
  quantity integer not null default 1,
  status text not null default 'posted'
    check (status in ('pending', 'posted', 'reversed', 'void')),
  external_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_revenue_events_source_idx
  on public.evntszn_revenue_events (source_type, source_id, occurred_at desc);

create index if not exists evntszn_revenue_events_event_idx
  on public.evntszn_revenue_events (event_type, occurred_at desc);

create table if not exists public.evntszn_commission_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  revenue_event_id uuid references public.evntszn_revenue_events(id) on delete cascade,
  user_id uuid not null,
  compensation_plan_id uuid not null references public.evntszn_compensation_plans(id) on delete restrict,
  source_type text not null,
  source_id text not null,
  event_type text not null,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'void', 'reversed')),
  rule_key text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists evntszn_commission_events_dedupe_idx
  on public.evntszn_commission_events (user_id, compensation_plan_id, revenue_event_id, rule_key);

create index if not exists evntszn_commission_events_user_idx
  on public.evntszn_commission_events (user_id, status, occurred_at desc);

insert into public.evntszn_compensation_plans (slug, label, description, status, scope_type, is_default, rules_json, metadata)
values
  (
    'platform_default',
    'Platform Default',
    'Default platform compensation plan with no custom operator override payouts.',
    'active',
    'default',
    true,
    '[]'::jsonb,
    '{"kind":"default"}'::jsonb
  ),
  (
    'internal_operator_growth_package',
    'Internal Operator Growth Package',
    'Custom package for one internal operator. This is assigned per user and is not the platform default.',
    'active',
    'user',
    false,
    '[
      {"key":"curator_override_percent","sourceType":"curator_account","eventType":"ticket_sale","amountType":"percent_gross","amount":3},
      {"key":"curator_standard_ticket","sourceType":"curator_account","eventType":"ticket_sale","amountType":"per_quantity","amount":0.15,"match":{"ticketClass":"standard"}},
      {"key":"curator_premium_ticket","sourceType":"curator_account","eventType":"ticket_sale","amountType":"per_quantity","amount":0.30,"match":{"ticketClass":"premium"}},
      {"key":"partner_standard_ticket","sourceType":"partner_account","eventType":"ticket_sale","amountType":"per_quantity","amount":0.15,"match":{"ticketClass":"standard"}},
      {"key":"partner_premium_ticket","sourceType":"partner_account","eventType":"ticket_sale","amountType":"per_quantity","amount":0.20,"match":{"ticketClass":"premium"}},
      {"key":"reserve_under_150_monthly","sourceType":"reserve_account","eventType":"subscription_billed","amountType":"flat","amount":10,"capacityMax":149},
      {"key":"reserve_150_plus_monthly","sourceType":"reserve_account","eventType":"subscription_billed","amountType":"flat","amount":20,"capacityMin":150},
      {"key":"reserve_under_150_usage","sourceType":"reserve_account","eventType":"reservation_created","amountType":"per_quantity","amount":0.10,"capacityMax":149},
      {"key":"reserve_150_plus_usage","sourceType":"reserve_account","eventType":"reservation_created","amountType":"per_quantity","amount":0.15,"capacityMin":150},
      {"key":"sponsor_pro_monthly","sourceType":"sponsor_account","eventType":"subscription_billed","amountType":"flat","amount":20,"match":{"billingPlanKey":"sponsor_pro"}},
      {"key":"sponsor_elite_monthly","sourceType":"sponsor_account","eventType":"subscription_billed","amountType":"flat","amount":49,"match":{"billingPlanKey":"sponsor_elite"}},
      {"key":"venue_pro_monthly","sourceType":"venue_account","eventType":"subscription_billed","amountType":"flat","amount":10,"match":{"venuePlanKey":"venue_pro"}},
      {"key":"venue_pro_reserve_monthly","sourceType":"venue_account","eventType":"subscription_billed","amountType":"flat","amount":15,"match":{"venuePlanKey":"venue_pro_reserve"}},
      {"key":"venue_reserve_usage","sourceType":"venue_account","eventType":"reservation_created","amountType":"per_quantity","amount":0.10,"match":{"reserveEnabled":true}},
      {"key":"epl_player_signup","sourceType":"epl_player_signup","eventType":"player_signup","amountType":"flat","amount":10}
    ]'::jsonb,
    '{"kind":"custom_operator"}'::jsonb
  )
on conflict (slug) do update
set
  label = excluded.label,
  description = excluded.description,
  status = excluded.status,
  scope_type = excluded.scope_type,
  is_default = excluded.is_default,
  rules_json = excluded.rules_json,
  metadata = excluded.metadata;

comment on table public.evntszn_account_attributions is 'Explicit managed account ownership, assignment, and active attribution state for commission eligibility.';
comment on table public.evntszn_compensation_plans is 'Default and custom compensation plans assigned to internal users.';
comment on table public.evntszn_compensation_plan_assignments is 'User to compensation-plan assignments with effective dates.';
comment on table public.evntszn_revenue_events is 'Queryable revenue event ledger for subscriptions, reservations, tickets, and signup-driven monetization.';
comment on table public.evntszn_commission_events is 'Derived commission ledger for operator compensation and recurring managed-account earnings.';
