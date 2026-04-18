create table if not exists public.evntszn_saved_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intent text not null check (intent in ('save', 'watch', 'plan')),
  entity_type text not null check (entity_type in ('event', 'venue', 'reserve', 'epl_city', 'epl_team', 'link', 'node')),
  entity_key text not null,
  title text not null,
  href text not null,
  city text,
  state text,
  starts_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, intent, entity_type, entity_key)
);

create index if not exists evntszn_saved_items_user_idx
  on public.evntszn_saved_items (user_id, created_at desc);

create index if not exists evntszn_saved_items_lookup_idx
  on public.evntszn_saved_items (user_id, intent, entity_type);

drop trigger if exists evntszn_saved_items_set_updated_at on public.evntszn_saved_items;
create trigger evntszn_saved_items_set_updated_at
before update on public.evntszn_saved_items
for each row execute function public.set_updated_at();
