-- ORYX v3: Operations tables missing for full-office functionality
-- Adds: org_identity, ticket scanning/checkins, and content/file management

create extension if not exists pgcrypto;

-- =========================
-- 1) Org Identity Layer
-- =========================
create table if not exists public.org_identity (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  brand_name text,
  industry_primary text,
  operating_regions text[] not null default '{}',
  default_timezone text not null default 'America/New_York',
  brand_colors jsonb not null default '{}'::jsonb,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 2) Ticket scanning / check-ins
-- =========================
create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  external_ticket_id text,
  ticket_type text,
  purchaser_email text,
  purchaser_name text,
  status text not null default 'valid',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (event_id, external_ticket_id)
);

create table if not exists public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id uuid references public.event_tickets(id) on delete set null,
  scanned_code text,
  scanned_by uuid references auth.users(id) on delete set null,
  scan_result text not null,
  scanned_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_event_checkins_event on public.event_checkins(event_id);
create index if not exists idx_event_checkins_org on public.event_checkins(org_id);

-- =========================
-- 3) File / content assets
-- =========================
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  scope_type text not null default 'org',
  scope_id uuid,
  asset_type text not null,
  title text not null,
  description text,
  storage_bucket text not null default 'oryx',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  checksum text,
  tags text[] not null default '{}',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_org on public.content_assets(org_id);
create index if not exists idx_assets_scope on public.content_assets(scope_type, scope_id);

-- =========================
-- 4) Context notes
-- =========================
create table if not exists public.context_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  context_type text not null,
  context_id uuid,
  title text not null,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_context_notes on public.context_notes(org_id, context_type, context_id);
