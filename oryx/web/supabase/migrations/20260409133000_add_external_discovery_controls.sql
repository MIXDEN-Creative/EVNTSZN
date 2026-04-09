create table if not exists public.external_discovery_controls (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ticketmaster', 'eventbrite')),
  external_event_id text not null,
  title text,
  city text,
  state text,
  starts_at timestamptz,
  status text not null default 'active' check (status in ('active', 'featured', 'deprioritized', 'hidden', 'unsuitable')),
  priority_adjustment integer not null default 0,
  override_title text,
  override_summary text,
  notes text,
  updated_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_event_id)
);

create index if not exists external_discovery_controls_status_idx
  on public.external_discovery_controls (status);

create index if not exists external_discovery_controls_source_event_idx
  on public.external_discovery_controls (source, external_event_id);

create trigger external_discovery_controls_set_updated_at
before update on public.external_discovery_controls
for each row execute function public.update_updated_at_column();
