begin;

alter table if exists epl.player_profiles
  add column if not exists headshot_storage_path text null;

alter table if exists epl.player_applications
  add column if not exists headshot_storage_path text null;

commit;
