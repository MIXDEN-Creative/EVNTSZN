create extension if not exists pgcrypto;

-- =========================
-- CORE
-- =========================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  industry_tags text[] not null default '{}',
  regions text[] not null default '{}',
  website text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.org_memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- PACKAGES / PLANS / ENTITLEMENTS (package-based access after payment)
-- =========================
create table if not exists public.plan_catalog (
  plan_key text primary key,
  plan_name text not null,
  monthly_price_cents integer not null default 0,
  annual_price_cents integer not null default 0,
  max_seats integer not null default 0,
  max_video_participant_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.org_plan (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  plan_key text not null references public.plan_catalog(plan_key),
  is_active boolean not null default true,
  current_seats integer not null default 1,
  video_minutes_used integer not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_entitlements (
  org_id uuid not null references public.organizations(id) on delete cascade,
  entitlement_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (org_id, entitlement_key)
);

create table if not exists public.stripe_customers (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- OWNER SELECTS BUSINESS AREAS
-- =========================
create table if not exists public.org_modules (
  org_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, module_key)
);

-- =========================
-- ROLES / PERMISSIONS (updated today)
-- =========================
create table if not exists public.org_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  role_key text not null,
  role_name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, role_key)
);

create table if not exists public.org_permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  perm_key text not null,
  perm_name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, perm_key)
);

create table if not exists public.org_role_permissions (
  role_id uuid not null references public.org_roles(id) on delete cascade,
  perm_id uuid not null references public.org_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, perm_id)
);

create table if not exists public.org_role_assignments (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.org_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id, role_id)
);

-- =========================
-- MESSAGING (elevated)
-- =========================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  convo_type text not null,
  context_type text,
  context_id uuid,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  message_kind text not null default 'standard',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  decision_title text not null,
  decision_body text,
  made_by uuid references auth.users(id) on delete set null,
  related_type text,
  related_id uuid,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  incident_type text not null,
  severity text not null default 'low',
  title text not null,
  details text,
  related_type text,
  related_id uuid,
  reported_by uuid references auth.users(id) on delete set null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- =========================
-- VENUES / EVENTS (expanded)
-- =========================
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address_label text,
  place_id text,
  lat numeric,
  lng numeric,
  capacity integer,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.event_staff (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_label text,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_readiness (
  event_id uuid primary key references public.events(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  status text not null,
  score integer not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);

create table if not exists public.event_reports (
  event_id uuid primary key references public.events(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  summary text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- INTELLIGENCE LAYERS
-- =========================
create table if not exists public.role_capacity_signals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_key text not null,
  signal_value numeric not null,
  computed_at timestamptz not null default now()
);

create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  scope_type text not null,
  item_key text not null,
  label text not null,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, scope_type, item_key)
);

create table if not exists public.compliance_status (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  scope_type text not null,
  scope_id uuid,
  status text not null default 'incomplete',
  missing jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);

create table if not exists public.financial_signals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  signal_key text not null,
  status text not null,
  value numeric,
  details jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create table if not exists public.narratives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  narrative_type text not null,
  title text not null,
  body text not null,
  related jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- MUSIC
-- =========================
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.artist_timeline (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  entry_type text not null,
  title text not null,
  details text,
  related jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- =========================
-- STRUCTURED ONBOARDING
-- =========================
create table if not exists public.onboarding_state (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  step_key text not null default 'start',
  completed_steps text[] not null default '{}',
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);
