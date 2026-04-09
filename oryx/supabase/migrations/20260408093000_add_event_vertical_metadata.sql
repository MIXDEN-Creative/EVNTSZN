alter table public.evntszn_events
  add column if not exists event_vertical text not null default 'evntszn',
  add column if not exists event_collection text,
  add column if not exists home_side_label text,
  add column if not exists away_side_label text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evntszn_events_event_vertical_check'
  ) then
    alter table public.evntszn_events
      add constraint evntszn_events_event_vertical_check
      check (event_vertical in ('evntszn', 'epl'));
  end if;
end $$;
