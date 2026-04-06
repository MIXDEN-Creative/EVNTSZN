cat > supabase/migrations/0013_oryx_rls_enforcement.sql <<'SQL'
-- ORYX 0013: RLS enforcement (defensive, schema-aware, error-proof)

-- =========================
-- 0) Helpers
-- =========================

create or replace function public.has_module(target_org uuid, target_module text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_entitlements e
    where e.org_id = target_org
      and e.module_key = target_module
      and e.enabled = true
  );
$$;

create or replace function public.has_permission(target_org uuid, target_perm_key text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_role_assignments a
    join public.org_role_permissions rp on rp.role_id = a.role_id
    join public.org_permissions p on p.id = rp.perm_id
    where a.org_id = target_org
      and a.user_id = auth.uid()
      and p.org_id = target_org
      and p.perm_key = target_perm_key
  );
$$;

create or replace function public.org_id_for_conversation(target_conversation uuid)
returns uuid
language sql
stable
as $$
  select c.org_id
  from public.conversations c
  where c.id = target_conversation
$$;

create or replace function public.org_id_for_event(target_event uuid)
returns uuid
language sql
stable
as $$
  select e.org_id
  from public.events e
  where e.id = target_event
$$;

create or replace function public.org_id_for_royalty_statement(target_statement uuid)
returns uuid
language sql
stable
as $$
  select s.org_id
  from public.royalty_statements s
  where s.id = target_statement
$$;

-- =========================
-- 1) Seed permissions per org
-- =========================

create table if not exists public._oryx_perm_seed (
  perm_key text primary key,
  perm_name text not null
);

insert into public._oryx_perm_seed (perm_key, perm_name) values
('org.manage', 'Manage organization settings, modules, seats'),
('roles.manage', 'Manage roles and permissions'),

('messaging.view', 'View messages and conversations'),
('messaging.manage', 'Create/update/delete conversations and messages'),

('events.view', 'View events, staff, tickets, checkins, reports'),
('events.manage', 'Create/update/delete events and event ops data'),

('venues.view', 'View venues'),
('venues.manage', 'Create/update/delete venues'),

('music.view', 'View artists, timelines, assets'),
('music.manage', 'Create/update/delete music ops data'),

('finance.view', 'View finance data'),
('finance.manage', 'Create/update/delete finance data'),

('compliance.view', 'View compliance items/status'),
('compliance.manage', 'Create/update/delete compliance items/status'),

('knowledge.view', 'View knowledge base'),
('knowledge.manage', 'Create/update/delete knowledge base'),

('sales.view', 'View sales ops'),
('sales.manage', 'Create/update/delete sales ops')

on conflict (perm_key) do nothing;

-- Insert seeds into each org's permission catalog (org-scoped)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='organizations')
     and exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_permissions')
  then
    insert into public.org_permissions (org_id, perm_key, perm_name, created_at)
    select o.id, s.perm_key, s.perm_name, now()
    from public.organizations o
    cross join public._oryx_perm_seed s
    on conflict (org_id, perm_key) do nothing;
  end if;
end $$;

-- =========================
-- 2) Utility: safe "enable RLS" + safe policy replace
-- =========================

do $$
begin
  -- profiles: user can only see/update themselves
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') then
    execute 'alter table public.profiles enable row level security';

    execute 'drop policy if exists oryx_profiles_self_select on public.profiles';
    execute 'create policy oryx_profiles_self_select on public.profiles
             for select using (user_id = auth.uid())';

    execute 'drop policy if exists oryx_profiles_self_update on public.profiles';
    execute 'create policy oryx_profiles_self_update on public.profiles
             for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
  end if;

  -- org_memberships: members can read; org.manage can manage
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_memberships') then
    execute 'alter table public.org_memberships enable row level security';

    execute 'drop policy if exists oryx_org_memberships_select on public.org_memberships';
    execute 'create policy oryx_org_memberships_select on public.org_memberships
             for select using (public.is_org_member(org_id))';

    execute 'drop policy if exists oryx_org_memberships_manage on public.org_memberships';
    execute 'create policy oryx_org_memberships_manage on public.org_memberships
             for all
             using (public.is_org_member(org_id) and public.has_permission(org_id,''org.manage''))
             with check (public.is_org_member(org_id) and public.has_permission(org_id,''org.manage''))';
  end if;

  -- org_roles
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_roles') then
    execute 'alter table public.org_roles enable row level security';

    execute 'drop policy if exists oryx_org_roles_select on public.org_roles';
    execute 'create policy oryx_org_roles_select on public.org_roles
             for select using (public.is_org_member(org_id))';

    execute 'drop policy if exists oryx_org_roles_manage on public.org_roles';
    execute 'create policy oryx_org_roles_manage on public.org_roles
             for all
             using (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))
             with check (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))';
  end if;

  -- org_permissions (org-scoped)
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_permissions') then
    execute 'alter table public.org_permissions enable row level security';

    execute 'drop policy if exists oryx_org_permissions_select on public.org_permissions';
    execute 'create policy oryx_org_permissions_select on public.org_permissions
             for select using (public.is_org_member(org_id))';

    execute 'drop policy if exists oryx_org_permissions_manage on public.org_permissions';
    execute 'create policy oryx_org_permissions_manage on public.org_permissions
             for all
             using (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))
             with check (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))';
  end if;

  -- org_role_permissions
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_role_permissions') then
    execute 'alter table public.org_role_permissions enable row level security';

    execute 'drop policy if exists oryx_org_role_permissions_manage on public.org_role_permissions';
    execute 'create policy oryx_org_role_permissions_manage on public.org_role_permissions
             for all
             using (
               exists (
                 select 1
                 from public.org_roles r
                 where r.id = role_id
                   and public.is_org_member(r.org_id)
                   and public.has_permission(r.org_id,''roles.manage'')
               )
             )
             with check (
               exists (
                 select 1
                 from public.org_roles r
                 where r.id = role_id
                   and public.is_org_member(r.org_id)
                   and public.has_permission(r.org_id,''roles.manage'')
               )
             )';
  end if;

  -- org_role_assignments
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_role_assignments') then
    execute 'alter table public.org_role_assignments enable row level security';

    execute 'drop policy if exists oryx_org_role_assignments_select on public.org_role_assignments';
    execute 'create policy oryx_org_role_assignments_select on public.org_role_assignments
             for select using (public.is_org_member(org_id))';

    execute 'drop policy if exists oryx_org_role_assignments_manage on public.org_role_assignments';
    execute 'create policy oryx_org_role_assignments_manage on public.org_role_assignments
             for all
             using (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))
             with check (public.is_org_member(org_id) and public.has_permission(org_id,''roles.manage''))';
  end if;

  -- org_entitlements
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='org_entitlements') then
    execute 'alter table public.org_entitlements enable row level security';

    execute 'drop policy if exists oryx_org_entitlements_select on public.org_entitlements';
    execute 'create policy oryx_org_entitlements_select on public.org_entitlements
             for select using (public.is_org_member(org_id))';

    execute 'drop policy if exists oryx_org_entitlements_manage on public.org_entitlements';
    execute 'create policy oryx_org_entitlements_manage on public.org_entitlements
             for all
             using (public.is_org_member(org_id) and public.has_permission(org_id,''org.manage''))
             with check (public.is_org_member(org_id) and public.has_permission(org_id,''org.manage''))';
  end if;

  -- =========================
  -- Messaging module
  -- =========================

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='conversations') then
    execute 'alter table public.conversations enable row level security';

    execute 'drop policy if exists oryx_conversations_select on public.conversations';
    execute 'create policy oryx_conversations_select on public.conversations
             for select
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.view'')
             )';

    execute 'drop policy if exists oryx_conversations_manage on public.conversations';
    execute 'create policy oryx_conversations_manage on public.conversations
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='conversation_members') then
    execute 'alter table public.conversation_members enable row level security';

    execute 'drop policy if exists oryx_conversation_members_all on public.conversation_members';
    execute 'create policy oryx_conversation_members_all on public.conversation_members
             for all
             using (
               public.is_org_member(public.org_id_for_conversation(conversation_id))
               and public.has_module(public.org_id_for_conversation(conversation_id),''messaging'')
               and public.has_permission(public.org_id_for_conversation(conversation_id),''messaging.manage'')
             )
             with check (
               public.is_org_member(public.org_id_for_conversation(conversation_id))
               and public.has_module(public.org_id_for_conversation(conversation_id),''messaging'')
               and public.has_permission(public.org_id_for_conversation(conversation_id),''messaging.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='messages') then
    execute 'alter table public.messages enable row level security';

    execute 'drop policy if exists oryx_messages_select on public.messages';
    execute 'create policy oryx_messages_select on public.messages
             for select
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.view'')
             )';

    execute 'drop policy if exists oryx_messages_manage on public.messages';
    execute 'create policy oryx_messages_manage on public.messages
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''messaging'')
               and public.has_permission(org_id,''messaging.manage'')
             )';
  end if;

  -- =========================
  -- Events module
  -- =========================

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='events') then
    execute 'alter table public.events enable row level security';

    execute 'drop policy if exists oryx_events_select on public.events';
    execute 'create policy oryx_events_select on public.events
             for select
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.view'')
             )';

    execute 'drop policy if exists oryx_events_manage on public.events';
    execute 'create policy oryx_events_manage on public.events
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='event_staff') then
    execute 'alter table public.event_staff enable row level security';

    execute 'drop policy if exists oryx_event_staff_all on public.event_staff';
    execute 'create policy oryx_event_staff_all on public.event_staff
             for all
             using (
               public.is_org_member(public.org_id_for_event(event_id))
               and public.has_module(public.org_id_for_event(event_id),''events'')
               and public.has_permission(public.org_id_for_event(event_id),''events.manage'')
             )
             with check (
               public.is_org_member(public.org_id_for_event(event_id))
               and public.has_module(public.org_id_for_event(event_id),''events'')
               and public.has_permission(public.org_id_for_event(event_id),''events.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='event_tickets') then
    execute 'alter table public.event_tickets enable row level security';

    execute 'drop policy if exists oryx_event_tickets_all on public.event_tickets';
    execute 'create policy oryx_event_tickets_all on public.event_tickets
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='event_checkins') then
    execute 'alter table public.event_checkins enable row level security';

    execute 'drop policy if exists oryx_event_checkins_all on public.event_checkins';
    execute 'create policy oryx_event_checkins_all on public.event_checkins
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='event_readiness') then
    execute 'alter table public.event_readiness enable row level security';

    execute 'drop policy if exists oryx_event_readiness_all on public.event_readiness';
    execute 'create policy oryx_event_readiness_all on public.event_readiness
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='event_reports') then
    execute 'alter table public.event_reports enable row level security';

    execute 'drop policy if exists oryx_event_reports_all on public.event_reports';
    execute 'create policy oryx_event_reports_all on public.event_reports
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''events'')
               and public.has_permission(org_id,''events.manage'')
             )';
  end if;

  -- =========================
  -- Venues module (supports both org_id and no-org_id schemas)
  -- =========================

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='venues') then
    execute 'alter table public.venues enable row level security';

    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='venues' and column_name='org_id') then
      execute 'drop policy if exists oryx_venues_select on public.venues';
      execute 'create policy oryx_venues_select on public.venues
               for select
               using (
                 public.is_org_member(org_id)
                 and public.has_module(org_id,''venues'')
                 and public.has_permission(org_id,''venues.view'')
               )';

      execute 'drop policy if exists oryx_venues_manage on public.venues';
      execute 'create policy oryx_venues_manage on public.venues
               for all
               using (
                 public.is_org_member(org_id)
                 and public.has_module(org_id,''venues'')
                 and public.has_permission(org_id,''venues.manage'')
               )
               with check (
                 public.is_org_member(org_id)
                 and public.has_module(org_id,''venues'')
                 and public.has_permission(org_id,''venues.manage'')
               )';
    else
      -- If venues has no org_id, allow access if user is member of ANY org (conservative fallback)
      execute 'drop policy if exists oryx_venues_fallback_select on public.venues';
      execute 'create policy oryx_venues_fallback_select on public.venues
               for select
               using (exists (select 1 from public.org_memberships m where m.user_id = auth.uid() and m.is_active = true))';

      execute 'drop policy if exists oryx_venues_fallback_manage on public.venues';
      execute 'create policy oryx_venues_fallback_manage on public.venues
               for all
               using (false) with check (false)';
    end if;
  end if;

  -- =========================
  -- Finance module
  -- =========================

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='financial_signals') then
    execute 'alter table public.financial_signals enable row level security';

    execute 'drop policy if exists oryx_financial_signals_select on public.financial_signals';
    execute 'create policy oryx_financial_signals_select on public.financial_signals
             for select
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''finance'')
               and public.has_permission(org_id,''finance.view'')
             )';

    execute 'drop policy if exists oryx_financial_signals_manage on public.financial_signals';
    execute 'create policy oryx_financial_signals_manage on public.financial_signals
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''finance'')
               and public.has_permission(org_id,''finance.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''finance'')
               and public.has_permission(org_id,''finance.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='royalty_statements') then
    execute 'alter table public.royalty_statements enable row level security';

    execute 'drop policy if exists oryx_royalty_statements_all on public.royalty_statements';
    execute 'create policy oryx_royalty_statements_all on public.royalty_statements
             for all
             using (
               public.is_org_member(org_id)
               and public.has_module(org_id,''finance'')
               and public.has_permission(org_id,''finance.manage'')
             )
             with check (
               public.is_org_member(org_id)
               and public.has_module(org_id,''finance'')
               and public.has_permission(org_id,''finance.manage'')
             )';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='royalty_statement_lines') then
    execute 'alter table public.royalty_statement_lines enable row level security';

    execute 'drop policy if exists oryx_royalty_statement_lines_all on public.royalty_statement_lines';
    execute 'create policy oryx_royalty_statement_lines_all on public.royalty_statement_lines
             for all
             using (
               public.is_org_member(public.org_id_for_royalty_statement(statement_id))
               and public.has_module(public.org_id_for_royalty_statement(statement_id),''finance'')
               and public.has_permission(public.org_id_for_royalty_statement(statement_id),''finance.manage'')
             )
             with check (
               public.is_org_member(public.org_id_for_royalty_statement(statement_id))
               and public.has_module(public.org_id_for_royalty_statement(statement_id),''finance'')
               and public.has_permission(public.org_id_for_royalty_statement(statement_id),''finance.manage'')
             )';
  end if;

  -- For the rest of finance tables that *should* have org_id, only apply policies if org_id exists
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='commission_plans')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='commission_plans' and column_name='org_id')
  then
    execute 'alter table public.commission_plans enable row level security';
    execute 'drop policy if exists oryx_commission_plans_all on public.commission_plans';
    execute 'create policy oryx_commission_plans_all on public.commission_plans
             for all
             using (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))
             with check (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='commission_rates')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='commission_rates' and column_name='org_id')
  then
    execute 'alter table public.commission_rates enable row level security';
    execute 'drop policy if exists oryx_commission_rates_all on public.commission_rates';
    execute 'create policy oryx_commission_rates_all on public.commission_rates
             for all
             using (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))
             with check (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='commission_earnings')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='commission_earnings' and column_name='org_id')
  then
    execute 'alter table public.commission_earnings enable row level security';
    execute 'drop policy if exists oryx_commission_earnings_all on public.commission_earnings';
    execute 'create policy oryx_commission_earnings_all on public.commission_earnings
             for all
             using (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))
             with check (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))';
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='payout_batches')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='payout_batches' and column_name='org_id')
  then
    execute 'alter table public.payout_batches enable row level security';
    execute 'drop policy if exists oryx_payout_batches_all on public.payout_batches';
    execute 'create policy oryx_payout_batches_all on public.payout_batches
             for all
             using (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))
             with check (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))';
  end if;

  -- payout_items (if it has org_id, use it; if not, expect payout_batch_id and join)
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='payout_items') then
    execute 'alter table public.payout_items enable row level security';

    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='payout_items' and column_name='org_id') then
      execute 'drop policy if exists oryx_payout_items_all on public.payout_items';
      execute 'create policy oryx_payout_items_all on public.payout_items
               for all
               using (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))
               with check (public.is_org_member(org_id) and public.has_module(org_id,''finance'') and public.has_permission(org_id,''finance.manage''))';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='payout_items' and column_name='batch_id')
          and exists (select 1 from information_schema.tables where table_schema='public' and table_name='payout_batches')
          and exists (select 1 from information_schema.columns where table_schema='public' and table_name='payout_batches' and column_name='org_id')
    then
      execute 'drop policy if exists oryx_payout_items_all on public.payout_items';
      execute 'create policy oryx_payout_items_all on public.payout_items
               for all
               using (
                 exists (
                   select 1
                   from public.payout_batches b
                   where b.id = batch_id
                     and public.is_org_member(b.org_id)
                     and public.has_module(b.org_id,''finance'')
                     and public.has_permission(b.org_id,''finance.manage'')
                 )
               )
               with check (
                 exists (
                   select 1
                   from public.payout_batches b
                   where b.id = batch_id
                     and public.is_org_member(b.org_id)
                     and public.has_module(b.org_id,''finance'')
                     and public.has_permission(b.org_id,''finance.manage'')
                 )
               )';
    else
      -- If we cannot safely infer org, lock it down
      execute 'drop policy if exists oryx_payout_items_lockdown on public.payout_items';
      execute 'create policy oryx_payout_items_lockdown on public.payout_items
               for all using (false) with check (false)';
    end if;
  end if;

end $$;

SQL