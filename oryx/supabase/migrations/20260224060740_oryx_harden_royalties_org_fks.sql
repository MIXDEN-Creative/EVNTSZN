begin;

-- Parent composite uniqueness (needed for composite FKs)
create unique index if not exists royalty_statements_id_org_id_uq
  on public.royalty_statements (id, org_id);

create unique index if not exists royalty_rules_id_org_id_uq
  on public.royalty_rules (id, org_id);

create unique index if not exists artists_id_org_id_uq
  on public.artists (id, org_id);

create unique index if not exists content_assets_id_org_id_uq
  on public.content_assets (id, org_id);

-- Add org_id to royalty_statement_lines
alter table public.royalty_statement_lines
  add column if not exists org_id uuid;

-- Backfill org_id from the parent statement
update public.royalty_statement_lines l
set org_id = s.org_id
from public.royalty_statements s
where l.statement_id = s.id
  and l.org_id is null;

alter table public.royalty_statement_lines
  alter column org_id set not null;

-- Helpful indexes
create index if not exists royalty_lines_statement_org_idx
  on public.royalty_statement_lines (statement_id, org_id);

create index if not exists royalty_lines_artist_org_idx
  on public.royalty_statement_lines (artist_id, org_id);

create index if not exists royalty_lines_asset_org_idx
  on public.royalty_statement_lines (asset_id, org_id);

create index if not exists royalty_lines_rule_org_idx
  on public.royalty_statement_lines (rule_id, org_id);

-- Composite FK: lines -> statements must match org
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='royalty_lines_statement_org_match_fkey'
      and conrelid='public.royalty_statement_lines'::regclass
  ) then
    alter table public.royalty_statement_lines
      add constraint royalty_lines_statement_org_match_fkey
      foreign key (statement_id, org_id)
      references public.royalty_statements (id, org_id)
      on delete cascade;
  end if;
end $$;

-- Composite FK: lines -> artists must match org (nullable, so SET NULL)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='royalty_lines_artist_org_match_fkey'
      and conrelid='public.royalty_statement_lines'::regclass
  ) then
    alter table public.royalty_statement_lines
      add constraint royalty_lines_artist_org_match_fkey
      foreign key (artist_id, org_id)
      references public.artists (id, org_id)
      on delete set null;
  end if;
end $$;

-- Composite FK: lines -> content_assets must match org (nullable, so SET NULL)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='royalty_lines_asset_org_match_fkey'
      and conrelid='public.royalty_statement_lines'::regclass
  ) then
    alter table public.royalty_statement_lines
      add constraint royalty_lines_asset_org_match_fkey
      foreign key (asset_id, org_id)
      references public.content_assets (id, org_id)
      on delete set null;
  end if;
end $$;

-- Composite FK: lines -> royalty_rules must match org (nullable, so SET NULL)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='royalty_lines_rule_org_match_fkey'
      and conrelid='public.royalty_statement_lines'::regclass
  ) then
    alter table public.royalty_statement_lines
      add constraint royalty_lines_rule_org_match_fkey
      foreign key (rule_id, org_id)
      references public.royalty_rules (id, org_id)
      on delete set null;
  end if;
end $$;

commit;
