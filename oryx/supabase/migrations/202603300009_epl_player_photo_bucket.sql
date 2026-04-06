begin;

insert into storage.buckets (id, name, public)
values ('epl-player-photos', 'epl-player-photos', true)
on conflict (id) do nothing;

commit;
