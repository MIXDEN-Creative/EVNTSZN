update public.evntszn_events
set
  start_at = '2026-05-01T19:00:00-04:00',
  end_at = '2026-05-01T22:00:00-04:00',
  subtitle = 'Baltimore connections that actually open doors.',
  description = E'Hey Baltimore,\n\nThis is where connections actually happen.\n\nThe Creator Kickoff is a curated networking experience bringing together creators, entrepreneurs, and ambitious individuals who are serious about building, collaborating, and leveling up.\n\nNo awkward small talk. No wasted time.\n\nJust real conversations, real opportunities, and the kind of room where one connection can open the next door.\n\nIf you’re ready to be in the right environment with the right people, this is where you need to be. 21+ event.',
  hero_note = 'Baltimore gets a premium social launch built around real chemistry and intentional room energy.'
where slug = 'the-creator-kickoff';

update public.evntszn_ticket_types
set
  price_usd = case name
    when 'Early Bird Access' then 8
    when 'General Admission' then 15
    when 'At The Door' then 20
    else price_usd
  end,
  quantity_total = case name
    when 'Early Bird Access' then 120
    when 'General Admission' then 90
    when 'At The Door' then 30
    else quantity_total
  end,
  max_per_order = case name
    when 'At The Door' then 2
    else 4
  end,
  sales_start_at = case name
    when 'Early Bird Access' then '2026-04-10T00:00:00-04:00'
    when 'General Admission' then '2026-04-17T00:00:00-04:00'
    when 'At The Door' then '2026-05-01T19:00:00-04:00'
    else sales_start_at
  end,
  sales_end_at = case name
    when 'Early Bird Access' then '2026-04-16T23:59:59-04:00'
    when 'General Admission' then '2026-05-01T18:45:00-04:00'
    when 'At The Door' then '2026-05-01T22:00:00-04:00'
    else sales_end_at
  end,
  is_active = true,
  visibility_mode = 'visible'
where event_id = '00000000-0000-0000-0000-00000000e902'
  and name in ('Early Bird Access', 'General Admission', 'At The Door');

delete from public.evntszn_ticket_types
where event_id in (
  select id from public.evntszn_events where lower(title) like '%midnight run%' or slug like '%midnight-run%'
);

delete from public.evntszn_event_operations
where event_id in (
  select id from public.evntszn_events where lower(title) like '%midnight run%' or slug like '%midnight-run%'
);

delete from public.evntszn_event_pulse_votes
where event_id in (
  select id from public.evntszn_events where lower(title) like '%midnight run%' or slug like '%midnight-run%'
);

delete from public.evntszn_events
where lower(title) like '%midnight run%' or slug like '%midnight-run%';
