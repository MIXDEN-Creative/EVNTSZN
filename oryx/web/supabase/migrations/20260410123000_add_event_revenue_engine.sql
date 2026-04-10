create table if not exists public.event_revenue_profiles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.evntszn_events(id) on delete cascade,
  event_type text not null check (event_type in ('host', 'city_leader', 'independent')),
  city_office_id uuid references public.city_offices(id) on delete set null,
  created_by_role text,
  is_independent boolean not null default false,
  independent_origin text check (independent_origin in ('city', 'hq')),
  created_at timestamptz not null default now()
);

create table if not exists public.commission_split_defaults (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('host', 'city_leader')),
  role_type text not null check (role_type in ('host', 'city_leader', 'city_office', 'hq')),
  percentage numeric(6,2) not null check (percentage >= 0 and percentage <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_type, role_type)
);

create table if not exists public.commission_splits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.event_revenue_profiles(id) on delete cascade,
  role_type text not null check (role_type in ('host', 'city_leader', 'city_office', 'hq')),
  percentage numeric(6,2) not null check (percentage >= 0 and percentage <= 100),
  created_at timestamptz not null default now(),
  unique (profile_id, role_type)
);

create table if not exists public.platform_fee_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  ticket_type text,
  price_threshold numeric(10,2),
  fee_amount numeric(10,2) not null check (fee_amount >= 0),
  city_percentage numeric(6,2) not null check (city_percentage >= 0 and city_percentage <= 100),
  hq_percentage numeric(6,2) not null check (hq_percentage >= 0 and hq_percentage <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (round((city_percentage + hq_percentage)::numeric, 2) = 100.00)
);

create table if not exists public.ticket_revenue_records (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.evntszn_tickets(id) on delete cascade,
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  gross_amount numeric(10,2) not null,
  platform_fee_amount numeric(10,2) not null,
  net_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  ticket_id uuid not null references public.evntszn_tickets(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('hq', 'city_office', 'host', 'city_leader', 'override')),
  recipient_id uuid,
  amount numeric(10,2) not null,
  source_type text not null check (source_type in ('ticket_split', 'platform_fee', 'override')),
  status text not null default 'pending' check (status in ('pending', 'locked', 'void')),
  created_at timestamptz not null default now()
);

create unique index if not exists revenue_ledger_ticket_recipient_unique
  on public.revenue_ledger (ticket_id, source_type, recipient_type, coalesce(recipient_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.commission_overrides (
  id uuid primary key default gen_random_uuid(),
  role_type text not null unique,
  percentage numeric(6,2) not null check (percentage >= 0 and percentage <= 100),
  applies_to_city_share boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_audit_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.evntszn_events(id) on delete cascade,
  ticket_id uuid references public.evntszn_tickets(id) on delete cascade,
  audit_type text not null check (audit_type in ('purchase', 'rebuild', 'manual_check')),
  expected_total numeric(10,2) not null,
  actual_total numeric(10,2) not null,
  is_balanced boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_recipients_snapshot (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  ticket_id uuid not null references public.evntszn_tickets(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('hq', 'city_office', 'host', 'city_leader', 'override')),
  recipient_id uuid,
  expected_amount numeric(10,2) not null,
  actual_amount numeric(10,2) not null,
  variance_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create unique index if not exists revenue_snapshot_ticket_recipient_unique
  on public.revenue_recipients_snapshot (ticket_id, recipient_type, coalesce(recipient_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists event_revenue_profiles_event_type_idx on public.event_revenue_profiles (event_type);
create index if not exists ticket_revenue_records_event_idx on public.ticket_revenue_records (event_id);
create index if not exists revenue_ledger_event_idx on public.revenue_ledger (event_id, created_at desc);
create index if not exists revenue_ledger_status_idx on public.revenue_ledger (status, created_at desc);
create index if not exists revenue_audit_runs_event_idx on public.revenue_audit_runs (event_id, created_at desc);

insert into public.commission_split_defaults (event_type, role_type, percentage)
values
  ('host', 'host', 60.00),
  ('host', 'city_office', 15.00),
  ('host', 'hq', 25.00),
  ('city_leader', 'city_leader', 65.00),
  ('city_leader', 'city_office', 15.00),
  ('city_leader', 'hq', 20.00)
on conflict (event_type, role_type) do update
set percentage = excluded.percentage,
    is_active = true;

insert into public.platform_fee_rules (rule_key, ticket_type, price_threshold, fee_amount, city_percentage, hq_percentage, is_active)
values
  ('default', null, null, 0.99, 15.00, 85.00, true),
  ('host-program', 'host program', null, 1.49, 15.00, 85.00, true),
  ('premium', 'premium', 75.00, 1.99, 15.00, 85.00, true)
on conflict (rule_key) do update
set ticket_type = excluded.ticket_type,
    price_threshold = excluded.price_threshold,
    fee_amount = excluded.fee_amount,
    city_percentage = excluded.city_percentage,
    hq_percentage = excluded.hq_percentage,
    is_active = excluded.is_active;

insert into public.commission_overrides (role_type, percentage, applies_to_city_share, is_active)
values
  ('commissioner', 5.00, true, true),
  ('deputy_commissioner', 3.50, true, true),
  ('host_development_manager', 3.00, true, true),
  ('city_leader_override', 2.00, true, true)
on conflict (role_type) do update
set percentage = excluded.percentage,
    applies_to_city_share = excluded.applies_to_city_share,
    is_active = excluded.is_active;
