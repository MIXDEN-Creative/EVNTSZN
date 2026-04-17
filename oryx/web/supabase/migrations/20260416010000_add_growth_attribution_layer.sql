alter table public.evntszn_operator_profiles
  add column if not exists attributed_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists attribution_source text check (attribution_source in ('manual', 'referral', 'assignment')),
  add column if not exists attribution_start_date date,
  add column if not exists attribution_active boolean not null default false;

alter table public.evntszn_venues
  add column if not exists attributed_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists attribution_source text check (attribution_source in ('manual', 'referral', 'assignment')),
  add column if not exists attribution_start_date date,
  add column if not exists attribution_active boolean not null default false;

alter table public.evntszn_sponsor_accounts
  add column if not exists attributed_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists attribution_source text check (attribution_source in ('manual', 'referral', 'assignment')),
  add column if not exists attribution_start_date date,
  add column if not exists attribution_active boolean not null default false;

alter table epl.season_registrations
  add column if not exists attributed_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists attribution_source text check (attribution_source in ('manual', 'referral', 'assignment')),
  add column if not exists attribution_start_date date,
  add column if not exists attribution_active boolean not null default false;

create table if not exists public.growth_attributions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('host', 'organizer', 'venue', 'partner', 'epl_player_source')),
  entity_id uuid not null,
  attributed_to_user_id uuid not null references auth.users(id) on delete cascade,
  attribution_source text not null check (attribution_source in ('manual', 'referral', 'assignment')),
  attribution_start_date date not null default current_date,
  attribution_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, attributed_to_user_id)
);

create index if not exists growth_attributions_lookup_idx
  on public.growth_attributions (entity_type, entity_id, attribution_active, attribution_start_date desc);

create table if not exists public.growth_compensation_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('host', 'organizer', 'venue', 'partner', 'epl_player_source')),
  entity_id uuid not null,
  attributed_to_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('ticket_sale')),
  revenue_amount_usd numeric(10,2) not null default 0,
  compensation_amount_usd numeric(10,2) not null default 0,
  source_order_id uuid references public.evntszn_ticket_orders(id) on delete cascade,
  source_event_id uuid references public.evntszn_events(id) on delete cascade,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists growth_comp_events_ticket_sale_unique
  on public.growth_compensation_events (event_type, entity_type, entity_id, attributed_to_user_id, source_order_id);

create index if not exists growth_comp_events_user_created_idx
  on public.growth_compensation_events (attributed_to_user_id, created_at desc);

create table if not exists public.growth_compensation_summary (
  id uuid primary key default gen_random_uuid(),
  attributed_to_user_id uuid not null unique references auth.users(id) on delete cascade,
  total_compensation_usd numeric(10,2) not null default 0,
  last_updated_at timestamptz not null default now()
);

create or replace function public.refresh_growth_compensation_summary(p_user_id uuid)
returns void
language plpgsql
as $$
declare
  v_total numeric(10,2);
begin
  select coalesce(round(sum(compensation_amount_usd)::numeric, 2), 0)
  into v_total
  from public.growth_compensation_events
  where attributed_to_user_id = p_user_id;

  insert into public.growth_compensation_summary (attributed_to_user_id, total_compensation_usd, last_updated_at)
  values (p_user_id, v_total, now())
  on conflict (attributed_to_user_id) do update
    set total_compensation_usd = excluded.total_compensation_usd,
        last_updated_at = excluded.last_updated_at;
end;
$$;
