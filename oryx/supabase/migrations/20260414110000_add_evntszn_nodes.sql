create table if not exists public.evntszn_nodes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id uuid,
  assigned_to_user_id uuid,
  slug text not null unique,
  public_identifier text unique,
  internal_name text not null,
  public_title text,
  node_type text not null default 'event_node' check (node_type in (
    'venue_node',
    'area_node',
    'event_node',
    'crew_node',
    'campaign_node',
    'partner_node',
    'popup_node',
    'ops_node'
  )),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived', 'damaged')),
  city text,
  state text,
  venue_id uuid references public.evntszn_venues(id) on delete set null,
  event_id uuid references public.evntszn_events(id) on delete set null,
  crew_profile_id uuid references public.evntszn_crew_profiles(id) on delete set null,
  link_page_id uuid references public.evntszn_link_pages(id) on delete set null,
  campaign_label text,
  placement_label text,
  destination_type text not null default 'event' check (destination_type in (
    'event',
    'venue',
    'area',
    'crew_marketplace',
    'crew_profile',
    'link_page',
    'custom_url',
    'ops'
  )),
  destination_payload jsonb not null default '{}'::jsonb,
  pulse_mode text not null default 'inherit' check (pulse_mode in ('inherit', 'event', 'venue', 'area', 'crew', 'off')),
  short_code text,
  qr_url text,
  tap_url text,
  public_url text,
  installed_at timestamptz,
  last_seen_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_node_interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  node_id uuid not null references public.evntszn_nodes(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('view', 'tap', 'reaction')),
  interaction_day date not null default current_date,
  actor_user_id uuid,
  session_key text,
  interaction_fingerprint text,
  source text,
  referrer text,
  city text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_nodes_owner_status_idx
  on public.evntszn_nodes(owner_user_id, status, updated_at desc);

create index if not exists evntszn_nodes_assigned_status_idx
  on public.evntszn_nodes(assigned_to_user_id, status, updated_at desc);

create index if not exists evntszn_nodes_type_status_idx
  on public.evntszn_nodes(node_type, status, updated_at desc);

create index if not exists evntszn_nodes_city_status_idx
  on public.evntszn_nodes(city, status, updated_at desc);

create index if not exists evntszn_nodes_event_idx
  on public.evntszn_nodes(event_id);

create index if not exists evntszn_nodes_venue_idx
  on public.evntszn_nodes(venue_id);

create index if not exists evntszn_nodes_destination_idx
  on public.evntszn_nodes(destination_type, updated_at desc);

create index if not exists evntszn_node_interactions_node_idx
  on public.evntszn_node_interactions(node_id, created_at desc);

create index if not exists evntszn_node_interactions_type_idx
  on public.evntszn_node_interactions(node_id, interaction_type, created_at desc);

create index if not exists evntszn_node_interactions_session_idx
  on public.evntszn_node_interactions(session_key, interaction_type, created_at desc);

create index if not exists evntszn_node_interactions_fingerprint_idx
  on public.evntszn_node_interactions(interaction_fingerprint, interaction_type, created_at desc);

drop trigger if exists evntszn_nodes_set_updated_at on public.evntszn_nodes;
create trigger evntszn_nodes_set_updated_at
before update on public.evntszn_nodes
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_node_interactions_set_updated_at on public.evntszn_node_interactions;
create trigger evntszn_node_interactions_set_updated_at
before update on public.evntszn_node_interactions
for each row execute function public.set_updated_at();
