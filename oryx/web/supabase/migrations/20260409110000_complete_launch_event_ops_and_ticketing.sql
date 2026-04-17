alter table public.evntszn_events
  add column if not exists event_class text not null default 'evntszn',
  add column if not exists mml_metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'evntszn_events_event_class_check'
  ) then
    alter table public.evntszn_events
      add constraint evntszn_events_event_class_check
      check (event_class in ('evntszn', 'independent_organizer', 'mml'));
  end if;
end $$;

alter table public.evntszn_ticket_types
  add column if not exists visibility_mode text not null default 'visible',
  add column if not exists sort_order integer not null default 100;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'evntszn_ticket_types_visibility_mode_check'
  ) then
    alter table public.evntszn_ticket_types
      add constraint evntszn_ticket_types_visibility_mode_check
      check (visibility_mode in ('visible', 'hidden'));
  end if;
end $$;

create table if not exists public.evntszn_event_operations (
  event_id uuid primary key references public.evntszn_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  objective text,
  run_of_show text,
  ops_notes text,
  updated_by_user_id uuid
);

drop trigger if exists evntszn_event_operations_set_updated_at on public.evntszn_event_operations;
create trigger evntszn_event_operations_set_updated_at
before update on public.evntszn_event_operations
for each row execute function public.set_updated_at();

create index if not exists evntszn_events_event_class_idx on public.evntszn_events(event_class);
create index if not exists evntszn_ticket_types_event_sort_idx on public.evntszn_ticket_types(event_id, sort_order asc);

update public.evntszn_events
set event_class = case
  when event_vertical = 'epl' then 'evntszn'
  when organizer_user_id is null then 'evntszn'
  else 'independent_organizer'
end
where event_class is null
   or event_class = 'evntszn';

insert into public.evntszn_venues (
  id,
  name,
  slug,
  city,
  state,
  timezone,
  capacity,
  contact_email,
  is_active
)
values (
  '00000000-0000-0000-0000-00000000e901',
  'Mystique Barrel Brewing & Lager House',
  'mystique-barrel-brewing-lager-house-baltimore-md',
  'Baltimore',
  'MD',
  'America/New_York',
  240,
  'hello@evntszn.com',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  city = excluded.city,
  state = excluded.state,
  timezone = excluded.timezone,
  capacity = excluded.capacity,
  contact_email = excluded.contact_email,
  is_active = true;

insert into public.evntszn_events (
  id,
  venue_id,
  title,
  slug,
  subtitle,
  description,
  hero_note,
  status,
  visibility,
  start_at,
  end_at,
  timezone,
  city,
  state,
  capacity,
  payout_account_label,
  scanner_status,
  event_vertical,
  event_collection,
  event_class
)
values (
  '00000000-0000-0000-0000-00000000e902',
  '00000000-0000-0000-0000-00000000e901',
  'The Creator Kickoff',
  'the-creator-kickoff',
  'Baltimore connections that actually open doors.',
  'Hey Baltimore,\n\nThis is where connections actually happen.\n\nThe Creator Kickoff is a curated networking experience bringing together creators, entrepreneurs, and ambitious individuals who are serious about building, collaborating, and leveling up.\n\nNo awkward small talk. No wasted time.\n\nJust real conversations, real opportunities, and the kind of room where one connection can open the next door.\n\nIf you’re ready to be in the right environment with the right people, this is where you need to be. 21+ event.',
  'Baltimore gets a premium social launch built around real chemistry, clean check-in, and intentional room energy.',
  'published',
  'published',
  '2026-05-01T19:00:00-04:00',
  '2026-05-01T22:00:00-04:00',
  'America/New_York',
  'Baltimore',
  'MD',
  240,
  'EVNTSZN HQ',
  'ready',
  'evntszn',
  'social',
  'launch'
)
on conflict (id) do update
set
  venue_id = excluded.venue_id,
  title = excluded.title,
  slug = excluded.slug,
  subtitle = excluded.subtitle,
  description = excluded.description,
  hero_note = excluded.hero_note,
  status = excluded.status,
  visibility = excluded.visibility,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  timezone = excluded.timezone,
  city = excluded.city,
  state = excluded.state,
  capacity = excluded.capacity,
  payout_account_label = excluded.payout_account_label,
  scanner_status = excluded.scanner_status,
  event_vertical = excluded.event_vertical,
  event_collection = excluded.event_collection,
  event_class = excluded.event_class;

insert into public.evntszn_ticket_types (
  event_id,
  name,
  description,
  price_usd,
  quantity_total,
  quantity_sold,
  max_per_order,
  sales_start_at,
  sales_end_at,
  is_active,
  visibility_mode,
  sort_order
)
values
  (
    '00000000-0000-0000-0000-00000000e902',
    'Early Bird Access',
    'Launch-price access for the first wave into The Creator Kickoff.',
    800,
    120,
    0,
    4,
    '2026-04-10T00:00:00-04:00',
    '2026-04-16T23:59:59-04:00',
    true,
    'visible',
    10
  ),
  (
    '00000000-0000-0000-0000-00000000e902',
    'General Admission',
    'Standard advance access for The Creator Kickoff.',
    1500,
    90,
    0,
    4,
    '2026-04-17T00:00:00-04:00',
    '2026-05-01T18:45:00-04:00',
    true,
    'visible',
    20
  ),
  (
    '00000000-0000-0000-0000-00000000e902',
    'At The Door',
    'Door inventory reserved for event-day release.',
    2000,
    30,
    0,
    2,
    '2026-05-01T19:00:00-04:00',
    '2026-05-01T22:00:00-04:00',
    true,
    'visible',
    30
  )
on conflict (event_id, name) do update
set
  description = excluded.description,
  price_usd = excluded.price_usd,
  quantity_total = excluded.quantity_total,
  max_per_order = excluded.max_per_order,
  sales_start_at = excluded.sales_start_at,
  sales_end_at = excluded.sales_end_at,
  is_active = excluded.is_active,
  visibility_mode = excluded.visibility_mode,
  sort_order = excluded.sort_order;

insert into public.evntszn_event_operations (
  event_id,
  objective,
  run_of_show,
  ops_notes
)
values (
  '00000000-0000-0000-0000-00000000e902',
  'Deliver a high-energy, structured social experience that feels premium and intentional, forces natural interaction without awkwardness, and showcases EVNTSZN as a new standard for events in Baltimore.',
  E'1. Arrival + Check-In (0:00–0:30)\nEnergy: Smooth, intriguing, elevated\nGuests check in through EVNTSZN scanner. Each guest receives a visual identifier. Music is already at a strong, welcoming level. Staff sets tone immediately.\n\n2. Open Mixer (0:30–1:15)\nEnergy: Natural, fluid, warming up\nGuests explore, grab drinks, start conversations. Light structure is subtly introduced. Staff encourages movement, not cliques.\n\n3. First Activation Moment (1:15–1:30)\nEnergy: Engaging, unexpected\nHost or MC briefly addresses the room and introduces a simple interactive moment to shift the room from passive to active.\n\n4. Curated Interaction Block (1:30–2:15)\nEnergy: Dynamic, social, slightly elevated\nStructured but smooth interaction layer with prompts, rotations, or themed engagement moments. No awkward games.\n\n5. Peak Energy Window (2:15–2:45)\nEnergy: High, confident, magnetic\nMusic rises, crowd is fully warmed, and staff captures content heavily during the highlight-reel moment.\n\n6. Social Free Flow (2:45–3:30)\nEnergy: Effortless, open, flowing\nStructure fades into full social freedom while conversation, movement, and bar energy stay strong.\n\n7. Closeout Window (3:30–End)\nEnergy: Smooth landing\nGradual wind-down, final conversations, strong staff presence, and a clean final impression.',
  'Creator Kickoff proves native EVNTSZN event operations, ticket release control, and scanner breakdown visibility before broader launch.'
)
on conflict (event_id) do update
set
  objective = excluded.objective,
  run_of_show = excluded.run_of_show,
  ops_notes = excluded.ops_notes;
