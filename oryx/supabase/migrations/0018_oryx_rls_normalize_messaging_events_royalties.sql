-- ORYX v18: Normalize RLS for tables that either:
--  (a) have org_id and should use org/module/permission checks, or
--  (b) do NOT have org_id and must join through a parent table that does.
--
-- Goals:
--  - No policies referencing columns that don't exist
--  - No duplicate "*_all" leftovers
--  - Consistent "*_select" + "*_manage" pattern where possible
--  - For join-through tables: use EXISTS join to enforce org + permission checks

-- =========================
-- Messaging: conversations
-- =========================
alter table if exists public.conversations enable row level security;

drop policy if exists oryx_conversations_all on public.conversations;
drop policy if exists oryx_conversations_select on public.conversations;
drop policy if exists oryx_conversations_manage on public.conversations;

create policy oryx_conversations_select on public.conversations
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.view')
);

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

-- =========================
-- Messaging: conversation_members (NO org_id)
-- Join through conversations(conversation_id -> conversations.id)
-- =========================
alter table if exists public.conversation_members enable row level security;

drop policy if exists oryx_conversation_members_all on public.conversation_members;
drop policy if exists oryx_conversation_members_select on public.conversation_members;
drop policy if exists oryx_conversation_members_manage on public.conversation_members;

create policy oryx_conversation_members_select on public.conversation_members
for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_members.conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.view')
  )
);

create policy oryx_conversation_members_manage on public.conversation_members
for all
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_members.conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.manage')
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_members.conversation_id
      and public.is_org_member(c.org_id)
      and public.has_module(c.org_id,'messaging')
      and public.has_permission(c.org_id,'messaging.manage')
  )
);

-- =========================
-- Messaging: messages (HAS org_id)
-- Extra safety:
--  - Must be org member
--  - Must be in the conversation (conversation_members)
-- =========================
alter table if exists public.messages enable row level security;

drop policy if exists oryx_messages_all on public.messages;
drop policy if exists oryx_messages_select on public.messages;
drop policy if exists oryx_messages_manage on public.messages;

-- View messages only if you're a member of that conversation in that org
create policy oryx_messages_select on public.messages
for select
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.view')
  and exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- Manage messages (insert/update/delete) only if:
--  - org member + messaging module + messaging.manage permission
--  - you are a member of the conversation
--  - for inserts/updates: sender_user_id must be you (keeps spoofing out)
create policy oryx_messages_manage on public.messages
for all
using (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
  and exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
)
with check (
  public.is_org_member(org_id)
  and public.has_module(org_id,'messaging')
  and public.has_permission(org_id,'messaging.manage')
  and sender_user_id = auth.uid()
  and exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
  )
);

-- =========================
-- Events: event_staff (NO org_id)
-- Join through events(event_id -> events.id)
-- =========================
alter table if exists public.event_staff enable row level security;

drop policy if exists oryx_event_staff_all on public.event_staff;
drop policy if exists oryx_event_staff_select on public.event_staff;
drop policy if exists oryx_event_staff_manage on public.event_staff;

create policy oryx_event_staff_select on public.event_staff
for select
using (
  exists (
    select 1
    from public.events e
    where e.id = event_staff.event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.view')
  )
);

create policy oryx_event_staff_manage on public.event_staff
for all
using (
  exists (
    select 1
    from public.events e
    where e.id = event_staff.event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.manage')
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_staff.event_id
      and public.is_org_member(e.org_id)
      and public.has_module(e.org_id,'events')
      and public.has_permission(e.org_id,'events.manage')
  )
);

-- =========================
-- Royalties: royalty_statement_lines (NO org_id)
-- Join through royalty_statements(statement_id -> royalty_statements.id)
-- =========================
alter table if exists public.royalty_statement_lines enable row level security;

drop policy if exists oryx_royalty_statement_lines_all on public.royalty_statement_lines;
drop policy if exists oryx_royalty_statement_lines_select on public.royalty_statement_lines;
drop policy if exists oryx_royalty_statement_lines_manage on public.royalty_statement_lines;

create policy oryx_royalty_statement_lines_select on public.royalty_statement_lines
for select
using (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.view')
  )
);

create policy oryx_royalty_statement_lines_manage on public.royalty_statement_lines
for all
using (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
)
with check (
  exists (
    select 1
    from public.royalty_statements s
    where s.id = royalty_statement_lines.statement_id
      and public.is_org_member(s.org_id)
      and public.has_module(s.org_id,'finance')
      and public.has_permission(s.org_id,'finance.manage')
  )
);

