begin;

-- =========================
-- EVENTS: ensure parent has composite uniqueness
-- =========================
create unique index if not exists events_id_org_id_uq
on public.events (id, org_id);

-- =========================
-- EVENT STAFF: add org_id, backfill, enforce org match
-- =========================
alter table public.event_staff
  add column if not exists org_id uuid;

update public.event_staff es
set org_id = e.org_id
from public.events e
where es.event_id = e.id
  and es.org_id is null;

alter table public.event_staff
  alter column org_id set not null;

create index if not exists event_staff_event_org_idx
on public.event_staff (event_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='event_staff_event_org_match_fkey'
      and conrelid='public.event_staff'::regclass
  ) then
    alter table public.event_staff
      add constraint event_staff_event_org_match_fkey
      foreign key (event_id, org_id)
      references public.events (id, org_id)
      on delete cascade;
  end if;
end $$;

-- Optional cleanup: drop old FK (event_id -> events.id) if it exists (redundant after composite)
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname='event_staff_event_id_fkey'
      and conrelid='public.event_staff'::regclass
  ) then
    alter table public.event_staff
      drop constraint event_staff_event_id_fkey;
  end if;
end $$;


-- =========================
-- COMMISSIONS: commission_rates should match commission_plans.org_id
-- =========================
alter table public.commission_rates
  add column if not exists org_id uuid;

update public.commission_rates cr
set org_id = cp.org_id
from public.commission_plans cp
where cr.plan_id = cp.id
  and cr.org_id is null;

alter table public.commission_rates
  alter column org_id set not null;

create unique index if not exists commission_plans_id_org_id_uq
on public.commission_plans (id, org_id);

create index if not exists commission_rates_plan_org_idx
on public.commission_rates (plan_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname='commission_rates_plan_org_match_fkey'
      and conrelid='public.commission_rates'::regclass
  ) then
    alter table public.commission_rates
      add constraint commission_rates_plan_org_match_fkey
      foreign key (plan_id, org_id)
      references public.commission_plans (id, org_id)
      on delete cascade;
  end if;
end $$;

-- Optional cleanup: drop old FK (plan_id -> commission_plans.id) if it exists (redundant after composite)
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname='commission_rates_plan_id_fkey'
      and conrelid='public.commission_rates'::regclass
  ) then
    alter table public.commission_rates
      drop constraint commission_rates_plan_id_fkey;
  end if;
end $$;


-- =========================
-- ROYALTIES: royalty_statement_lines org match across statement/artist/asset/rule
-- =========================
alter table public.royalty_statement_lines
  add column if not exists org_id uuid;

update public.royalty_statement_lines l
set org_id = s.org_id
from public.royalty_statements s
where l.statement_id = s.id
  and l.org_id is null;

alter table public.royalty_statement_lines
  alter column org_id set not null;

create unique index if not exists royalty_statements_id_org_id_uq
on public.royalty_statements (id, org_id);

create unique index if not exists artists_id_org_id_uq
on public.artists (id, org_id);

create unique index if not exists content_assets_id_org_id_uq
on public.content_assets (id, org_id);

create unique index if not exists royalty_rules_id_org_id_uq
on public.royalty_rules (id, org_id);

create index if not exists royalty_lines_statement_org_idx
on public.royalty_statement_lines (statement_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
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


-- =========================
-- PAYOUTS: ensure composite uniqueness on batches (items already hardened by you)
-- =========================
create unique index if not exists payout_batches_id_org_id_uq
on public.payout_batches (id, org_id);

commit;
