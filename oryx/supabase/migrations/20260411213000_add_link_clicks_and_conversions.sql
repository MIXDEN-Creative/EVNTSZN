create table if not exists public.evntszn_link_event_clicks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid not null references public.evntszn_link_pages(id) on delete cascade,
  link_owner_user_id uuid references auth.users(id) on delete set null,
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  clicked_by_user_id uuid references auth.users(id) on delete set null,
  session_key text,
  click_fingerprint text,
  source text not null default 'link_page',
  referrer text,
  target_path text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.evntszn_link_conversions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  link_page_id uuid references public.evntszn_link_pages(id) on delete set null,
  link_click_id uuid references public.evntszn_link_event_clicks(id) on delete set null,
  link_owner_user_id uuid references auth.users(id) on delete set null,
  event_id uuid not null references public.evntszn_events(id) on delete cascade,
  ticket_order_id uuid not null unique references public.evntszn_ticket_orders(id) on delete cascade,
  purchaser_user_id uuid references auth.users(id) on delete set null,
  attributed_order_count integer not null default 0,
  attributed_ticket_count integer not null default 0,
  attributed_gross_revenue_cents integer not null default 0,
  attribution_status text not null default 'unattributed' check (attribution_status in ('attributed', 'unattributed', 'expired', 'ambiguous', 'mismatch')),
  attribution_method text,
  clicked_at timestamptz,
  converted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists evntszn_link_event_clicks_link_event_idx
  on public.evntszn_link_event_clicks(link_page_id, event_id, created_at desc);

create index if not exists evntszn_link_event_clicks_user_event_idx
  on public.evntszn_link_event_clicks(clicked_by_user_id, event_id, created_at desc);

create index if not exists evntszn_link_event_clicks_session_event_idx
  on public.evntszn_link_event_clicks(session_key, event_id, created_at desc);

create index if not exists evntszn_link_conversions_link_idx
  on public.evntszn_link_conversions(link_page_id, attribution_status, converted_at desc);

create index if not exists evntszn_link_conversions_event_idx
  on public.evntszn_link_conversions(event_id, converted_at desc);

drop trigger if exists evntszn_link_event_clicks_set_updated_at on public.evntszn_link_event_clicks;
create trigger evntszn_link_event_clicks_set_updated_at
before update on public.evntszn_link_event_clicks
for each row execute function public.set_updated_at();

drop trigger if exists evntszn_link_conversions_set_updated_at on public.evntszn_link_conversions;
create trigger evntszn_link_conversions_set_updated_at
before update on public.evntszn_link_conversions
for each row execute function public.set_updated_at();
