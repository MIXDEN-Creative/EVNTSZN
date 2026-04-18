create table if not exists public.evntszn_pulse_activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_type text not null,
  city text not null,
  area_label text,
  actor_user_id uuid references auth.users(id) on delete set null,
  session_key text,
  reference_type text,
  reference_id text,
  weight integer not null default 1,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_pulse_activity_city_idx
  on public.evntszn_pulse_activity (city, created_at desc);

create index if not exists evntszn_pulse_activity_area_idx
  on public.evntszn_pulse_activity (city, area_label, created_at desc);

create table if not exists public.evntszn_pulse_states (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  city text not null,
  area_label text,
  score integer not null default 0,
  state text not null default 'low' check (state in ('low', 'active', 'rising', 'hot')),
  signal_count integer not null default 0,
  last_activity_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists evntszn_pulse_states_city_area_idx
  on public.evntszn_pulse_states (city, area_label);

drop trigger if exists evntszn_pulse_states_set_updated_at on public.evntszn_pulse_states;
create trigger evntszn_pulse_states_set_updated_at
before update on public.evntszn_pulse_states
for each row execute function public.set_updated_at();

alter table public.evntszn_nodes
  add column if not exists location_type text
    check (location_type in ('venue', 'nightlife_hotspot', 'dining_hotspot', 'event_location', 'epl_location', 'sponsor_activation', 'curator_destination', 'city_interest')),
  add column if not exists area_label text,
  add column if not exists known_location_name text,
  add column if not exists known_location_address text,
  add column if not exists known_location_metadata jsonb not null default '{}'::jsonb;

alter table public.evntszn_node_interactions
  add column if not exists node_type_snapshot text,
  add column if not exists destination_type_snapshot text,
  add column if not exists area_label text,
  add column if not exists device_type text,
  add column if not exists resolved_destination_slug text,
  add column if not exists resolved_destination_id text;
