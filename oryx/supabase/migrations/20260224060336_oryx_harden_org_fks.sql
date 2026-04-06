-- oryx_harden_org_fks.sql
-- Hardens org isolation at the DB level with composite keys (id, org_id)
-- Safe to run multiple times.

begin;

-- ------------------------------------------------------------
-- 0) Parent-table composite uniqueness (required for composite FKs)
-- ------------------------------------------------------------

create unique index if not exists conversations_id_org_id_uq
  on public.conversations (id, org_id);

create unique index if not exists events_id_org_id_uq
  on public.events (id, org_id);

create unique index if not exists event_tickets_id_org_id_uq
  on public.event_tickets (id, org_id);

create unique index if not exists commission_plans_id_org_id_uq
  on public.commission_plans (id, org_id);

create unique index if not exists payout_batches_id_org_id_uq
  on public.payout_batches (id, org_id);

-- ------------------------------------------------------------
-- 1) Events: event_tickets must match events by (event_id, org_id)
-- ------------------------------------------------------------

create index if not exists event_tickets_event_org_idx
  on public.event_tickets (event_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_tickets_event_org_match_fkey'
      and conrelid = 'public.event_tickets'::regclass
  ) then
    alter table public.event_tickets
      add constraint event_tickets_event_org_match_fkey
      foreign key (event_id, org_id)
      references public.events (id, org_id)
      on delete cascade;
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) Events: event_checkins must match events + tickets by org
-- ------------------------------------------------------------

create index if not exists event_checkins_event_org_idx
  on public.event_checkins (event_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_checkins_event_org_match_fkey'
      and conrelid = 'public.event_checkins'::regclass
  ) then
    alter table public.event_checkins
      add constraint event_checkins_event_org_match_fkey
      foreign key (event_id, org_id)
      references public.events (id, org_id)
      on delete cascade;
  end if;
end $$;

create index if not exists event_checkins_ticket_org_idx
  on public.event_checkins (ticket_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_checkins_ticket_org_match_fkey'
      and conrelid = 'public.event_checkins'::regclass
  ) then
    alter table public.event_checkins
      add constraint event_checkins_ticket_org_match_fkey
      foreign key (ticket_id, org_id)
      references public.event_tickets (id, org_id)
      on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------
-- 3) Events: event_staff add org_id + FK (event_id, org_id) -> events
-- ------------------------------------------------------------

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
    where conname = 'event_staff_event_org_match_fkey'
      and conrelid = 'public.event_staff'::regclass
  ) then
    alter table public.event_staff
      add constraint event_staff_event_org_match_fkey
      foreign key (event_id, org_id)
      references public.events (id, org_id)
      on delete cascade;
  end if;
end $$;

-- ------------------------------------------------------------
-- 4) Messaging: conversation_members add org_id + FK (conversation_id, org_id)
-- ------------------------------------------------------------

alter table public.conversation_members
  add column if not exists org_id uuid;

update public.conversation_members cm
set org_id = c.org_id
from public.conversations c
where cm.conversation_id = c.id
  and cm.org_id is null;

alter table public.conversation_members
  alter column org_id set not null;

create index if not exists conversation_members_convo_org_idx
  on public.conversation_members (conversation_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_members_convo_org_match_fkey'
      and conrelid = 'public.conversation_members'::regclass
  ) then
    alter table public.conversation_members
      add constraint conversation_members_convo_org_match_fkey
      foreign key (conversation_id, org_id)
      references public.conversations (id, org_id)
      on delete cascade;
  end if;
end $$;

-- ------------------------------------------------------------
-- 5) Finance: commission_rates add org_id + FK (plan_id, org_id) -> commission_plans
-- ------------------------------------------------------------

alter table public.commission_rates
  add column if not exists org_id uuid;

update public.commission_rates cr
set org_id = cp.org_id
from public.commission_plans cp
where cr.plan_id = cp.id
  and cr.org_id is null;

alter table public.commission_rates
  alter column org_id set not null;

create index if not exists commission_rates_plan_org_idx
  on public.commission_rates (plan_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'commission_rates_plan_org_match_fkey'
      and conrelid = 'public.commission_rates'::regclass
  ) then
    alter table public.commission_rates
      add constraint commission_rates_plan_org_match_fkey
      foreign key (plan_id, org_id)
      references public.commission_plans (id, org_id)
      on delete cascade;
  end if;
end $$;

-- ------------------------------------------------------------
-- 6) Finance: payout_items org_id + FK batch_id/org_id -> payout_batches
-- (You already have this, but this keeps it future-proof if reset changes)
-- ------------------------------------------------------------

alter table public.payout_items
  add column if not exists org_id uuid;

update public.payout_items pi
set org_id = b.org_id
from public.payout_batches b
where pi.batch_id = b.id
  and pi.org_id is null;

alter table public.payout_items
  alter column org_id set not null;

create unique index if not exists payout_items_id_org_id_uq
  on public.payout_items (id, org_id);

create index if not exists payout_items_batch_id_org_id_idx
  on public.payout_items (batch_id, org_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payout_items_batch_org_match_fkey'
      and conrelid = 'public.payout_items'::regclass
  ) then
    alter table public.payout_items
      add constraint payout_items_batch_org_match_fkey
      foreign key (batch_id, org_id)
      references public.payout_batches (id, org_id)
      on delete cascade;
  end if;
end $$;

commit;
