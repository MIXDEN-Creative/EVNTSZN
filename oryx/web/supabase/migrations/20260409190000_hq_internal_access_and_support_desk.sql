insert into public.permissions (code, label, description, category, is_system)
values
  ('hq.manage', 'HQ Manage', 'Global HQ-only command access across EVNTSZN and EPL.', 'access', true),
  ('support.manage', 'Support Manage', 'Review and manage support tickets across the platform.', 'support', true),
  ('support.assign', 'Support Assign', 'Assign support tickets to internal operators.', 'support', true),
  ('support.respond', 'Support Respond', 'Update support ticket status and add internal notes.', 'support', true)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    category = excluded.category;

insert into public.roles (code, name, description, is_system, is_active)
values
  ('hq_operator', 'HQ Operator', 'Global HQ access for founder-level or explicitly assigned headquarters users.', true, true),
  ('office_operator', 'Office Operator', 'Scoped city-office access for support, scanner, and local execution.', true, true),
  ('ops_operator', 'Ops Operator', 'Execution-focused role for daily event, scanner, and support work.', true, true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'admin.manage', 'roles.manage', 'invites.manage', 'orders.view', 'orders.manage', 'rewards.view', 'rewards.manage',
  'catalog.manage', 'customers.view', 'analytics.view', 'approvals.manage', 'sponsors.manage', 'store.manage',
  'content.manage', 'scanner.manage', 'events.manage', 'opportunities.manage', 'city.manage',
  'hq.manage', 'support.manage', 'support.assign', 'support.respond'
)
where r.code = 'hq_operator'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'city.manage', 'scanner.manage', 'events.manage', 'opportunities.manage', 'support.respond'
)
where r.code = 'office_operator'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'events.manage', 'scanner.manage', 'support.respond'
)
where r.code = 'ops_operator'
on conflict (role_id, permission_id) do nothing;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id uuid references auth.users (id) on delete set null,
  assignee_user_id uuid references auth.users (id) on delete set null,
  related_event_id uuid references public.evntszn_events (id) on delete set null,
  name text,
  email text,
  role_label text,
  issue_type text not null,
  issue_subtype text,
  source_surface text,
  page_path text,
  page_url text,
  related_order_code text,
  occurred_on date,
  occurred_at_label text,
  severity text not null default 'normal' check (severity in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'waiting', 'in_progress', 'escalated', 'resolved', 'closed')),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  update_type text not null default 'note',
  status_to text,
  assignee_user_id uuid references auth.users (id) on delete set null,
  note_body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, issue_type, severity, created_at desc);
create index if not exists support_tickets_assignee_idx on public.support_tickets (assignee_user_id, status);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_ticket_updates_ticket_idx on public.support_ticket_updates (ticket_id, created_at desc);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.update_updated_at_column();
