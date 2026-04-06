-- ORYX v4: Finance engine
-- Adds: royalty calculator, commission plans, payouts, and audit-friendly ledgers
-- NOTE: ORYX supports org-defined commissions. MIXDEN has its own commission plan and overrides logic.

create extension if not exists pgcrypto;

-- =========================
-- 1) Royalties
-- =========================

create table if not exists public.royalty_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- scope: org-wide, artist-specific, track-specific, contract-specific
  scope_type text not null default 'org',  -- org, artist, asset, contract
  scope_id uuid,

  rule_name text not null,
  rate_type text not null, -- percent, per_unit, tiered
  rate_value numeric(10,4) not null default 0, -- e.g. 0.1500 = 15%
  currency text not null default 'USD',

  effective_from date,
  effective_to date,

  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_royalty_rules_org on public.royalty_rules(org_id);
create index if not exists idx_royalty_rules_scope on public.royalty_rules(scope_type, scope_id);

create table if not exists public.royalty_statements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  period_start date not null,
  period_end date not null,

  status text not null default 'draft', -- draft, issued, paid, void
  issued_at timestamptz,
  created_at timestamptz not null default now(),

  unique (org_id, period_start, period_end)
);

create table if not exists public.royalty_statement_lines (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.royalty_statements(id) on delete cascade,

  artist_id uuid references public.artists(id) on delete set null,
  asset_id uuid references public.content_assets(id) on delete set null,

  units numeric(18,4) not null default 0,
  gross_amount numeric(18,2) not null default 0,
  deductions numeric(18,2) not null default 0,
  net_amount numeric(18,2) not null default 0,

  rule_id uuid references public.royalty_rules(id) on delete set null,
  notes text,

  created_at timestamptz not null default now()
);

create index if not exists idx_royalty_lines_statement on public.royalty_statement_lines(statement_id);

-- =========================
-- 2) Commission system (Org-defined)
-- =========================

create table if not exists public.commission_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  plan_name text not null,
  is_active boolean not null default true,

  currency text not null default 'USD',
  meta jsonb not null default '{}'::jsonb, -- store structure rules, caps, notes

  created_at timestamptz not null default now()
);

create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.commission_plans(id) on delete cascade,

  role_key text not null, -- e.g., account_manager, assistant_manager, agency_owner
  base_rate numeric(6,4) not null default 0, -- 0.3000 = 30%
  boosters_rate numeric(6,4) not null default 0, -- 0.4500 = 45%

  allow_overrides boolean not null default false,
  override_rate numeric(6,4) not null default 0, -- agency override (if enabled)

  created_at timestamptz not null default now(),

  unique (plan_id, role_key)
);

create table if not exists public.commission_earnings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- sale context
  sale_type text not null, -- subscription, seats, boosters, add_on, other
  sale_ref text, -- stripe invoice id, internal id, etc.
  amount numeric(18,2) not null,
  currency text not null default 'USD',

  -- who earned it
  earner_user_id uuid references auth.users(id) on delete set null,
  earner_role_key text,

  -- optional: override beneficiary (agency owner)
  override_user_id uuid references auth.users(id) on delete set null,
  override_amount numeric(18,2) not null default 0,

  -- computed
  base_commission numeric(18,2) not null default 0,
  boosters_commission numeric(18,2) not null default 0,
  total_commission numeric(18,2) not null default 0,

  status text not null default 'earned', -- earned, approved, paid, void
  created_at timestamptz not null default now()
);

create index if not exists idx_commission_earnings_org on public.commission_earnings(org_id);
create index if not exists idx_commission_earnings_earner on public.commission_earnings(earner_user_id);

-- =========================
-- 3) Payouts / Ledger
-- =========================

create table if not exists public.payout_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  batch_type text not null, -- commissions, royalties, mixed
  period_start date,
  period_end date,

  status text not null default 'draft', -- draft, approved, processing, paid, void
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payout_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.payout_batches(id) on delete cascade,

  payee_user_id uuid references auth.users(id) on delete set null,
  payee_name text,
  payee_email text,

  item_type text not null, -- commission, royalty
  ref_id uuid, -- commission_earnings.id or royalty_statement_lines.id

  amount numeric(18,2) not null,
  currency text not null default 'USD',

  status text not null default 'pending', -- pending, paid, failed, void
  paid_at timestamptz,

  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payout_items_batch on public.payout_items(batch_id);

-- =========================
-- 4) Seed: MIXDEN commission plan (optional)
-- This applies only to MIXDEN org. You’ll attach this plan to MIXDEN’s org_id later.
-- =========================

create table if not exists public.mixden_commission_defaults (
  id boolean primary key default true,
  account_manager_base numeric(6,4) not null default 0.3000,
  assistant_manager_base numeric(6,4) not null default 0.3500,
  agency_owner_base numeric(6,4) not null default 0.4000,
  boosters_rate numeric(6,4) not null default 0.4500,
  agency_override_rate numeric(6,4) not null default 0.0500,
  created_at timestamptz not null default now()
);

insert into public.mixden_commission_defaults (id)
values (true)
on conflict (id) do nothing;
