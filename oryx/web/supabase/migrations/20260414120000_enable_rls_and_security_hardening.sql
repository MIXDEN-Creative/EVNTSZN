-- Phase 1: Security Hardening & RLS Enablement

-- Helper Functions
create or replace function public.is_platform_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and r.is_active = true
      and (r.code = 'platform_admin' or r.name = 'Platform Admin')
  );
end;
$$;

create or replace function public.has_platform_permission(p_permission_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    join public.role_permissions rp on r.id = rp.role_id
    join public.permissions p on rp.permission_id = p.id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and r.is_active = true
      and p.code = p_permission_code
  );
end;
$$;

-- Enable RLS on all tables
-- This is a representative list of core tables. 
-- In a real scenario, we'd loop through all tables in public and epl schemas.

-- Public Schema
alter table public.evntszn_profiles enable row level security;
alter table public.evntszn_venues enable row level security;
alter table public.evntszn_events enable row level security;
alter table public.evntszn_event_staff enable row level security;
alter table public.evntszn_ticket_types enable row level security;
alter table public.evntszn_ticket_orders enable row level security;
alter table public.evntszn_tickets enable row level security;
alter table public.evntszn_referrals enable row level security;
alter table public.evntszn_event_activity enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.invites enable row level security;
alter table public.evntszn_operator_profiles enable row level security;
alter table public.evntszn_nodes enable row level security;
alter table public.evntszn_node_interactions enable row level security;
alter table public.evntszn_link_pages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_updates enable row level security;
alter table public.site_content_entries enable row level security;
alter table public.evntszn_crew_profiles enable row level security;
alter table public.evntszn_applications enable row level security;
alter table public.merch_orders enable row level security;
alter table public.payouts enable row level security;
alter table public.revenue_ledger enable row level security;

-- EPL Schema
alter table epl.leagues enable row level security;
alter table epl.seasons enable row level security;
alter table epl.teams enable row level security;
alter table epl.player_profiles enable row level security;
alter table epl.player_applications enable row level security;
alter table epl.season_registrations enable row level security;
alter table epl.opportunities enable row level security;
alter table epl.staff_applications enable row level security;
alter table epl.staff_roles_catalog enable row level security;
alter table epl.season_staff_assignments enable row level security;

-- Policies for evntszn_profiles
create policy "Users can view their own profile"
  on public.evntszn_profiles for select
  using (auth.uid() = user_id);

create policy "Admins can view all profiles"
  on public.evntszn_profiles for select
  using (public.is_platform_admin());

create policy "Users can update their own profile"
  on public.evntszn_profiles for update
  using (auth.uid() = user_id);

-- Venues
create policy "Anyone can view active venues"
  on public.evntszn_venues for select
  using (is_active = true);

create policy "Venue owners can manage their venues"
  on public.evntszn_venues for all
  using (auth.uid() = owner_user_id);

-- Support Tickets
create policy "Users can view their own support tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id or email = (select email from auth.users where id = auth.uid()));

create policy "Admins can manage support tickets"
  on public.support_tickets for all
  using (public.has_platform_permission('support.manage'));

create policy "Venue managers can manage assigned venues"
  on public.evntszn_venues for all
  using (
    exists (
      select 1 from public.evntszn_event_staff
      join public.evntszn_events on evntszn_event_staff.event_id = evntszn_events.id
      where evntszn_events.venue_id = public.evntszn_venues.id
      and evntszn_event_staff.user_id = auth.uid()
      and evntszn_event_staff.role_code = 'venue_manager'
      and evntszn_event_staff.status = 'active'
    )
  );

create policy "Admins can manage all venues"
  on public.evntszn_venues for all
  using (public.is_platform_admin());

-- Policies for evntszn_events
create policy "Anyone can view published events"
  on public.evntszn_events for select
  using (status = 'published' and visibility = 'published');

create policy "Organizers can manage their own events"
  on public.evntszn_events for all
  using (auth.uid() = organizer_user_id);

create policy "Staff can view assigned events"
  on public.evntszn_events for select
  using (
    exists (
      select 1 from public.evntszn_event_staff
      where event_id = public.evntszn_events.id
      and user_id = auth.uid()
      and status = 'active'
    )
  );

create policy "Admins can manage all events"
  on public.evntszn_events for all
  using (public.is_platform_admin());

-- Policies for evntszn_tickets (Attendee Access)
create policy "Users can view their own tickets"
  on public.evntszn_tickets for select
  using (auth.uid() = purchaser_user_id);

create policy "Scanners can view and update tickets for their events"
  on public.evntszn_tickets for all
  using (
    exists (
      select 1 from public.evntszn_event_staff
      where event_id = public.evntszn_tickets.event_id
      and user_id = auth.uid()
      and (can_scan = true or role_code = 'scanner')
      and status = 'active'
    )
  );

-- Policies for evntszn_ticket_orders
create policy "Users can view their own orders"
  on public.evntszn_ticket_orders for select
  using (auth.uid() = purchaser_user_id);

create policy "Admins can view all orders"
  on public.evntszn_ticket_orders for select
  using (public.has_platform_permission('orders.view'));

-- Policies for evntszn_event_staff
create policy "Staff can view their own assignments"
  on public.evntszn_event_staff for select
  using (auth.uid() = user_id);

create policy "Admins can manage staff"
  on public.evntszn_event_staff for all
  using (public.has_platform_permission('scanner.manage') or public.is_platform_admin());

-- Policies for ticket types
create policy "Anyone can view ticket types for published events"
  on public.evntszn_ticket_types for select
  using (
    exists (
      select 1 from public.evntszn_events
      where id = public.evntszn_ticket_types.event_id
      and status = 'published'
      and visibility = 'published'
    )
  );

create policy "Organizers can manage ticket types for their events"
  on public.evntszn_ticket_types for all
  using (
    exists (
      select 1 from public.evntszn_events
      where id = public.evntszn_ticket_types.event_id
      and organizer_user_id = auth.uid()
    )
  );

-- Policies for epl player profiles
create policy "Players can view their own profile"
  on epl.player_profiles for select
  using (email = (select email from auth.users where id = auth.uid()));

create policy "Admins can view all player profiles"
  on epl.player_profiles for select
  using (public.has_platform_permission('approvals.manage'));

-- RBAC Tables (Admins only)
create policy "Admins can manage RBAC roles"
  on public.roles for all using (public.is_platform_admin());
create policy "Admins can manage RBAC permissions"
  on public.permissions for all using (public.is_platform_admin());
create policy "Admins can manage RBAC role_permissions"
  on public.role_permissions for all using (public.is_platform_admin());
create policy "Admins can manage RBAC user_roles"
  on public.user_roles for all using (public.is_platform_admin());
create policy "Admins can manage RBAC invites"
  on public.invites for all using (public.is_platform_admin());

-- EPL Opportunities (Public Read)
create policy "Anyone can view open opportunities"
  on epl.opportunities for select
  using (status = 'open' and is_active = true and is_archived = false);

create policy "Admins can manage opportunities"
  on epl.opportunities for all
  using (public.is_platform_admin() or public.has_platform_permission('opportunities.manage'));

-- Nodes and Interactions
create policy "Anyone can view active nodes"
  on public.evntszn_nodes for select
  using (status = 'active');

create policy "Owners can manage their nodes"
  on public.evntszn_nodes for all
  using (auth.uid() = owner_user_id);

create policy "Anyone can create interactions"
  on public.evntszn_node_interactions for insert
  with check (true);

create policy "Owners can view their node interactions"
  on public.evntszn_node_interactions for select
-- Link Pages
create policy "Anyone can view published link pages"
  on public.evntszn_link_pages for select
  using (status = 'published');

create policy "Owners can manage their link pages"
  on public.evntszn_link_pages for all
  using (auth.uid() = user_id);

-- Operator Profiles
create policy "Users can view their own operator profile"
  on public.evntszn_operator_profiles for select
  using (auth.uid() = user_id);

create policy "Admins can view all operator profiles"
  on public.evntszn_operator_profiles for select
  using (public.is_platform_admin());

-- Site Content
create policy "Anyone can view site content"
  on public.site_content_entries for select
  using (true);

create policy "Admins can manage site content"
  on public.site_content_entries for all
  using (public.has_platform_permission('content.manage'));

