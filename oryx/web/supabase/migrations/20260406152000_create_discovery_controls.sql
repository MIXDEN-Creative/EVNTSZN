create table if not exists public.site_content_entries (
  key text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  surface text not null default 'web' check (surface in ('web', 'app', 'scanner', 'epl', 'ops', 'hq', 'admin', 'global')),
  label text not null,
  description text,
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_by uuid
);

create table if not exists public.discovery_listing_controls (
  event_id uuid primary key references public.evntszn_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_type text not null default 'evntszn'
    check (source_type in ('evntszn', 'host', 'independent_organizer')),
  badge_label text,
  featured boolean not null default false,
  listing_priority integer not null default 0,
  promo_collection text,
  is_discoverable boolean not null default true,
  updated_by uuid
);

create index if not exists site_content_entries_surface_idx
  on public.site_content_entries(surface, is_active);

create index if not exists discovery_listing_controls_priority_idx
  on public.discovery_listing_controls(source_type, featured desc, listing_priority desc);

drop trigger if exists site_content_entries_set_updated_at on public.site_content_entries;
create trigger site_content_entries_set_updated_at
before update on public.site_content_entries
for each row execute function public.set_updated_at();

drop trigger if exists discovery_listing_controls_set_updated_at on public.discovery_listing_controls;
create trigger discovery_listing_controls_set_updated_at
before update on public.discovery_listing_controls
for each row execute function public.set_updated_at();

insert into public.site_content_entries (key, surface, label, description, content, is_active)
values
  (
    'homepage.hero',
    'web',
    'Homepage Hero',
    'Primary public hero messaging and calls to action.',
    jsonb_build_object(
      'eyebrow', 'EVNTSZN discovery',
      'title', 'A premium discovery surface for the events people actually move on.',
      'description', 'Discover EVNTSZN-native events first, explore broader city demand intelligently, and move from public discovery into a premium member experience without losing trust, clarity, or momentum.',
      'primaryCtaLabel', 'Explore EVNTSZN events',
      'primaryCtaHref', '/events',
      'secondaryCtaLabel', 'Open discovery',
      'secondaryCtaHref', '/events',
      'tertiaryCtaLabel', 'Member access',
      'tertiaryCtaHref', '/account/login?next=/account'
    ),
    true
  ),
  (
    'homepage.banner',
    'web',
    'Homepage Banner',
    'Top-of-page trust and positioning message.',
    jsonb_build_object(
      'eyebrow', 'Premium access',
      'title', 'EVNTSZN keeps discovery public and operations controlled.',
      'body', 'Attendees can explore EVNTSZN openly while scanner, league, admin, HQ, and operations surfaces stay clearly separated and purpose-built.'
    ),
    true
  ),
  (
    'homepage.discovery',
    'web',
    'Homepage Discovery',
    'Search and discovery copy for the public landing page.',
    jsonb_build_object(
      'headline', 'Start with EVNTSZN. Expand with market-scale discovery.',
      'body', 'Native EVNTSZN inventory stays primary. External discovery adds breadth when you want a wider city pulse without diluting the platform.',
      'disclosure', 'Broader event discovery is available when you search for it. EVNTSZN native inventory remains the primary path and featured layer.',
      'searchPlaceholder', 'Search events, artists, moments',
      'cityPlaceholder', 'City',
      'nativeHeadline', 'Featured EVNTSZN events',
      'hostHeadline', 'EVNTSZN Host events',
      'independentHeadline', 'Independent Organizer events',
      'externalHeadline', 'External discovery, handled carefully'
    ),
    true
  ),
  (
    'homepage.taxonomy',
    'web',
    'Homepage Taxonomy',
    'Category and city content blocks for search intent and discovery merchandising.',
    jsonb_build_object(
      'categories', jsonb_build_array(
        jsonb_build_object('title', 'Music', 'description', 'Concerts, DJ nights, artist drops, and live performances.'),
        jsonb_build_object('title', 'Nightlife', 'description', 'Late-night sessions, premium parties, and city after-dark experiences.'),
        jsonb_build_object('title', 'Sports', 'description', 'League nights, sports entertainment, tournaments, and fan experiences.'),
        jsonb_build_object('title', 'Things to Do', 'description', 'Curated city energy for people looking for the best events right now.')
      ),
      'cities', jsonb_build_array(
        jsonb_build_object('name', 'New York', 'description', 'Flagship market for high-density nightlife, entertainment, and premium event discovery.'),
        jsonb_build_object('name', 'Baltimore', 'description', 'League, culture, and city-community events with EVNTSZN-native energy.'),
        jsonb_build_object('name', 'Atlanta', 'description', 'Music, nightlife, sports culture, and standout hosted experiences.'),
        jsonb_build_object('name', 'Miami', 'description', 'High-velocity nightlife and destination-event demand.')
      )
    ),
    true
  )
on conflict (key) do update
set
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description,
  content = excluded.content,
  is_active = excluded.is_active;
