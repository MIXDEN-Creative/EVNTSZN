create table if not exists public.evntszn_link_pages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  display_name text,
  headline text,
  intro text,
  city text,
  state text,
  profile_image_url text,
  primary_email text,
  accent_label text,
  plan_tier text not null default 'starter' check (plan_tier in ('starter', 'pro', 'premium')),
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'trial', 'active', 'past_due', 'canceled')),
  fee_bearing_enabled boolean not null default false,
  monthly_price_usd integer,
  email_capture_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_link_social_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid not null references public.evntszn_link_pages(id) on delete cascade,
  platform text not null,
  label text,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.evntszn_link_offers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid not null references public.evntszn_link_pages(id) on delete cascade,
  offer_type text not null default 'digital_product' check (offer_type in ('digital_product', 'ticket', 'service', 'affiliate', 'custom')),
  title text not null,
  description text,
  href text not null,
  cta_label text not null default 'Open',
  price_label text,
  fee_amount_usd integer,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.evntszn_link_event_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid not null references public.evntszn_link_pages(id) on delete cascade,
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  sort_order integer not null default 0,
  is_featured boolean not null default true,
  unique (link_page_id, event_id)
);

create table if not exists public.evntszn_link_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid not null references public.evntszn_link_pages(id) on delete cascade,
  captured_by_user_id uuid references auth.users(id) on delete set null,
  name text,
  email text not null,
  source text not null default 'public_link',
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_crew_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  display_name text not null,
  category text not null check (category in ('host', 'dj', 'photographer', 'videographer', 'security', 'promoter', 'producer', 'brand_ambassador', 'custom')),
  custom_category text,
  headline text,
  short_bio text,
  city text,
  state text,
  rate_amount_usd integer,
  rate_unit text check (rate_unit in ('hour', 'event', 'project', 'shift')),
  availability_state text not null default 'available' check (availability_state in ('available', 'limited', 'unavailable')),
  accepts_booking_requests boolean not null default true,
  booking_fee_usd integer,
  portfolio_links jsonb not null default '[]'::jsonb,
  portfolio_images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  instagram_url text,
  website_url text,
  contact_email text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_crew_booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  crew_profile_id uuid not null references public.evntszn_crew_profiles(id) on delete cascade,
  requester_user_id uuid references auth.users(id) on delete set null,
  requested_by_name text not null,
  requested_by_email text not null,
  requested_by_phone text,
  requested_role text,
  event_name text,
  event_date timestamptz,
  city text,
  state text,
  message text,
  budget_amount_usd integer,
  flat_booking_fee_usd integer,
  status text not null default 'requested' check (status in ('requested', 'reviewing', 'accepted', 'declined', 'completed', 'canceled')),
  responded_at timestamptz,
  responded_by_user_id uuid references auth.users(id) on delete set null,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_event_pulse_votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  voter_user_id uuid references auth.users(id) on delete set null,
  voter_fingerprint text,
  vote_day date not null default current_date,
  energy_level smallint not null check (energy_level between 1 and 10),
  crowd_density smallint not null check (crowd_density between 1 and 10),
  music_vibe smallint not null check (music_vibe between 1 and 10),
  bar_activity smallint not null check (bar_activity between 1 and 10),
  source text not null default 'event_page',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_link_pages_status_idx
  on public.evntszn_link_pages(status, plan_tier, updated_at desc);
create index if not exists evntszn_link_social_links_page_idx
  on public.evntszn_link_social_links(link_page_id, sort_order);
create index if not exists evntszn_link_offers_page_idx
  on public.evntszn_link_offers(link_page_id, sort_order);
create index if not exists evntszn_link_event_links_page_idx
  on public.evntszn_link_event_links(link_page_id, sort_order);
create index if not exists evntszn_link_leads_page_idx
  on public.evntszn_link_leads(link_page_id, created_at desc);
create index if not exists evntszn_crew_profiles_status_idx
  on public.evntszn_crew_profiles(status, category, availability_state, city, updated_at desc);
create index if not exists evntszn_crew_booking_requests_profile_idx
  on public.evntszn_crew_booking_requests(crew_profile_id, status, created_at desc);
create index if not exists evntszn_event_pulse_votes_event_idx
  on public.evntszn_event_pulse_votes(event_id, vote_day, created_at desc);
create unique index if not exists evntszn_event_pulse_votes_user_daily_idx
  on public.evntszn_event_pulse_votes(event_id, voter_user_id, vote_day)
  where voter_user_id is not null;
create unique index if not exists evntszn_event_pulse_votes_fingerprint_daily_idx
  on public.evntszn_event_pulse_votes(event_id, voter_fingerprint, vote_day)
  where voter_user_id is null and voter_fingerprint is not null;

drop trigger if exists evntszn_link_pages_set_updated_at on public.evntszn_link_pages;
create trigger evntszn_link_pages_set_updated_at
before update on public.evntszn_link_pages
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_link_social_links_set_updated_at on public.evntszn_link_social_links;
create trigger evntszn_link_social_links_set_updated_at
before update on public.evntszn_link_social_links
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_link_offers_set_updated_at on public.evntszn_link_offers;
create trigger evntszn_link_offers_set_updated_at
before update on public.evntszn_link_offers
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_link_event_links_set_updated_at on public.evntszn_link_event_links;
create trigger evntszn_link_event_links_set_updated_at
before update on public.evntszn_link_event_links
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_link_leads_set_updated_at on public.evntszn_link_leads;
create trigger evntszn_link_leads_set_updated_at
before update on public.evntszn_link_leads
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_crew_profiles_set_updated_at on public.evntszn_crew_profiles;
create trigger evntszn_crew_profiles_set_updated_at
before update on public.evntszn_crew_profiles
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_crew_booking_requests_set_updated_at on public.evntszn_crew_booking_requests;
create trigger evntszn_crew_booking_requests_set_updated_at
before update on public.evntszn_crew_booking_requests
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_event_pulse_votes_set_updated_at on public.evntszn_event_pulse_votes;
create trigger evntszn_event_pulse_votes_set_updated_at
before update on public.evntszn_event_pulse_votes
for each row execute function public.set_updated_at();
