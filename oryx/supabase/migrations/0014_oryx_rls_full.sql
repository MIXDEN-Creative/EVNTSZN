-- ORYX 0014 - Full RLS (with dynamic-safe commission_rates policy)
-- Key rule:
--   - If table has org_id: use it directly.
--   - If table does NOT have org_id: infer org via parent table with org_id.
--   - If we cannot safely infer org, lock it down.

-- Assumes helper functions already exist:
--   public.is_org_member(target_org uuid) returns boolean
--   public.has_module(target_org uuid, module_key text) returns boolean
--   public.has_permission(target_org uuid, perm_key text) returns boolean

-- ================================================================
-- MESSAGING
-- ================================================================

alter table if exists public.conversations enable row level security;

drop policy if exists oryx_conversations_select on public.conversations;
create policy oryx_conversations_select on public.conversations
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.view')
);

drop policy if exists oryx_conversations_manage on public.conversations;
create policy oryx_conversations_manage on public.conversations
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
);

-- conversation_members has no org_id -> infer via conversations
alter table if exists public.conversation_members enable row level security;

drop policy if exists oryx_conversation_members_select on public.conversation_members;
create policy oryx_conversation_members_select on public.conversation_members
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.view')
  )
);

drop policy if exists oryx_conversation_members_manage on public.conversation_members;
create policy oryx_conversation_members_manage on public.conversation_members
for all
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.manage')
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.manage')
  )
);

-- messages has org_id
alter table if exists public.messages enable row level security;

drop policy if exists oryx_messages_select on public.messages;
create policy oryx_messages_select on public.messages
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.view')
);

drop policy if exists oryx_messages_manage on public.messages;
create policy oryx_messages_manage on public.messages
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
);

-- ================================================================
-- VENUES
-- ================================================================

alter table if exists public.venues enable row level security;

drop policy if exists oryx_venues_select on public.venues;
create policy oryx_venues_select on public.venues
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'venues')
  and public.has_permission(org_id,'venues.view')
);

drop policy if exists oryx_venues_manage on public.venues;
create policy oryx_venues_manage on public.venues
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'venues')
  and public.has_permission(org_id,'venues.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'venues')
  and public.has_permission(org_id,'venues.manage')
);

-- ================================================================
-- EVENTS
-- ================================================================

alter table if exists public.events enable row level security;

drop policy if exists oryx_events_select on public.events;
create policy oryx_events_select on public.events
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.view')
);

drop policy if exists oryx_events_manage on public.events;
create policy oryx_events_manage on public.events
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
);

alter table if exists public.event_tickets enable row level security;

drop policy if exists oryx_event_tickets_select on public.event_tickets;
create policy oryx_event_tickets_select on public.event_tickets
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.view')
);

drop policy if exists oryx_event_tickets_manage on public.event_tickets;
create policy oryx_event_tickets_manage on public.event_tickets
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
);

alter table if exists public.event_checkins enable row level security;

drop policy if exists oryx_event_checkins_select on public.event_checkins;
create policy oryx_event_checkins_select on public.event_checkins
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.view')
);

drop policy if exists oryx_event_checkins_manage on public.event_checkins;
create policy oryx_event_checkins_manage on public.event_checkins
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
);

alter table if exists public.event_readiness enable row level security;

drop policy if exists oryx_event_readiness_select on public.event_readiness;
create policy oryx_event_readiness_select on public.event_readiness
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.view')
);

drop policy if exists oryx_event_readiness_manage on public.event_readiness;
create policy oryx_event_readiness_manage on public.event_readiness
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
);

alter table if exists public.event_reports enable row level security;

drop policy if exists oryx_event_reports_select on public.event_reports;
create policy oryx_event_reports_select on public.event_reports
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.view')
);

drop policy if exists oryx_event_reports_manage on public.event_reports;
create policy oryx_event_reports_manage on public.event_reports
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'events')
  and public.has_permission(org_id,'events.manage')
);

-- event_staff has no org_id -> infer via events
alter table if exists public.event_staff enable row level security;

drop policy if exists oryx_event_staff_select on public.event_staff;
create policy oryx_event_staff_select on public.event_staff
for select
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.view')
  )
);

drop policy if exists oryx_event_staff_manage on public.event_staff;
create policy oryx_event_staff_manage on public.event_staff
for all
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.manage')
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.manage')
  )
);

-- ================================================================
-- MUSIC OPS
-- ================================================================

alter table if exists public.artists enable row level security;

drop policy if exists oryx_artists_select on public.artists;
create policy oryx_artists_select on public.artists
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.view')
);

drop policy if exists oryx_artists_manage on public.artists;
create policy oryx_artists_manage on public.artists
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
);

alter table if exists public.artist_timeline enable row level security;

drop policy if exists oryx_artist_timeline_select on public.artist_timeline;
create policy oryx_artist_timeline_select on public.artist_timeline
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.view')
);

drop policy if exists oryx_artist_timeline_manage on public.artist_timeline;
create policy oryx_artist_timeline_manage on public.artist_timeline
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
);

alter table if exists public.content_assets enable row level security;

drop policy if exists oryx_content_assets_select on public.content_assets;
create policy oryx_content_assets_select on public.content_assets
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.view')
);

drop policy if exists oryx_content_assets_manage on public.content_assets;
create policy oryx_content_assets_manage on public.content_assets
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'music')
  and public.has_permission(org_id,'music.manage')
);

-- ================================================================
-- FINANCE
-- ================================================================

alter table if exists public.financial_signals enable row level security;

drop policy if exists oryx_financial_signals_select on public.financial_signals;
create policy oryx_financial_signals_select on public.financial_signals
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

drop policy if exists oryx_financial_signals_manage on public.financial_signals;
create policy oryx_financial_signals_manage on public.financial_signals
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

alter table if exists public.royalty_rules enable row level security;

drop policy if exists oryx_royalty_rules_select on public.royalty_rules;
create policy oryx_royalty_rules_select on public.royalty_rules
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

drop policy if exists oryx_royalty_rules_manage on public.royalty_rules;
create policy oryx_royalty_rules_manage on public.royalty_rules
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

alter table if exists public.royalty_statements enable row level security;

drop policy if exists oryx_royalty_statements_select on public.royalty_statements;
create policy oryx_royalty_statements_select on public.royalty_statements
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.view')
);

drop policy if exists oryx_royalty_statements_manage on public.royalty_statements;
create policy oryx_royalty_statements_manage on public.royalty_statements
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- royalty_statement_lines has no org_id -> infer via royalty_statements
alter table if exists public.royalty_statement_lines enable row level security;

drop policy if exists oryx_royalty_statement_lines_all on public.royalty_statement_lines;
create policy oryx_royalty_statement_lines_all on public.royalty_statement_lines
for all
using (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
);

-- commission_plans should have org_id
alter table if exists public.commission_plans enable row level security;

drop policy if exists oryx_commission_plans_all on public.commission_plans;
create policy oryx_commission_plans_all on public.commission_plans
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'finance')
  and public.has_permission(org_id,'finance.manage')
);

-- commission_rates: dynamic-safe policy (NO org_id on this table)
alter table if exists public.commission_rates enable row level security;

drop policy if exists oryx_commission_rates_all on public.commission_rates;

do $$
declare
  has_plan_id boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='commission_rates' and column_name='plan_id'
  );
  has_commission_plan_id boolean := exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='commission_rates' and column_name='commission_plan_id'
  );
begin
  if has_plan_id then
    execute $POL$
      create policy oryx_commission_rates_all on public.commission_rates
      for all
      using (
        exists (
          select 1
          from public.commission_plans cp
          where cp.id = plan_id
            and public.is_org_member(cp.org_id)
            and public.has_module(cp.org_id,'finance')
            and public.has_permission(cp.org_id,'finance.manage')
        )
      )
      with check (
        exists (
          select 1
          from public.commission_plans cp
          where cp.id = plan_id
            and public.is_org_member(cp.org_id)
            and public.has_module(cp.org_id,'finance')
            and public.has_permission(cp.org_id,'finance.manage')
        )
      )
    $POL$;
  end if;
end $$;

