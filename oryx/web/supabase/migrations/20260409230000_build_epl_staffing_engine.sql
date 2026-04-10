create table if not exists epl.staff_role_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_opportunity_id uuid unique references epl.opportunities (id) on delete set null,
  title text not null,
  role_code text,
  department text,
  role_type text not null default 'volunteer' check (role_type in ('paid', 'volunteer')),
  summary text,
  responsibilities text[] not null default '{}'::text[],
  requirements text[] not null default '{}'::text[],
  default_access_role_id uuid,
  default_assignment_permission_codes text[] not null default '{}'::text[],
  default_operational_tags text[] not null default '{}'::text[],
  volunteer_perks text[] not null default '{}'::text[],
  pay_amount numeric(10,2),
  pay_type text check (pay_type in ('hourly', 'stipend', 'fixed')),
  employment_status text check (employment_status in ('full_time', 'part_time', 'seasonal', 'event_based')),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.staff_positions (
  id uuid primary key default gen_random_uuid(),
  legacy_opportunity_id uuid unique references epl.opportunities (id) on delete set null,
  role_template_id uuid not null references epl.staff_role_templates (id) on delete cascade,
  title_override text,
  event_id uuid references public.evntszn_events (id) on delete set null,
  season_id uuid references epl.seasons (id) on delete set null,
  city text,
  state text,
  position_status text not null default 'open' check (position_status in ('open', 'nearly_filled', 'filled', 'closed', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'internal_only')),
  slots_needed integer not null default 1,
  slots_filled integer not null default 0,
  priority integer not null default 100,
  notes text,
  publicly_listed boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  access_role_id uuid,
  assignment_permission_codes text[] not null default '{}'::text[],
  onboarding_notes text,
  volunteer_perks text[] not null default '{}'::text[],
  pay_amount numeric(10,2),
  pay_type text check (pay_type in ('hourly', 'stipend', 'fixed')),
  employment_status text check (employment_status in ('full_time', 'part_time', 'seasonal', 'event_based')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists epl.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references epl.staff_positions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  application_id uuid references epl.staff_applications (id) on delete set null,
  assignment_status text not null default 'pending' check (assignment_status in ('pending', 'assigned', 'confirmed', 'declined', 'removed')),
  notes text,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists epl.staff_applications
  add column if not exists position_id uuid references epl.staff_positions (id) on delete set null,
  add column if not exists role_template_id uuid references epl.staff_role_templates (id) on delete set null;

alter table if exists public.support_tickets
  add column if not exists resolution_notes text;

create index if not exists staff_role_templates_role_type_idx on epl.staff_role_templates (role_type, is_active, sort_order);
create index if not exists staff_positions_status_idx on epl.staff_positions (position_status, visibility, city, priority);
create index if not exists staff_positions_template_idx on epl.staff_positions (role_template_id, season_id, event_id);
create index if not exists staff_assignments_position_idx on epl.staff_assignments (position_id, assignment_status);
create index if not exists staff_assignments_user_idx on epl.staff_assignments (user_id, assignment_status);

drop trigger if exists staff_role_templates_set_updated_at on epl.staff_role_templates;
create trigger staff_role_templates_set_updated_at
before update on epl.staff_role_templates
for each row execute function public.update_updated_at_column();

drop trigger if exists staff_positions_set_updated_at on epl.staff_positions;
create trigger staff_positions_set_updated_at
before update on epl.staff_positions
for each row execute function public.update_updated_at_column();

drop trigger if exists staff_assignments_set_updated_at on epl.staff_assignments;
create trigger staff_assignments_set_updated_at
before update on epl.staff_assignments
for each row execute function public.update_updated_at_column();

insert into epl.staff_role_templates (
  legacy_opportunity_id,
  title,
  role_code,
  department,
  role_type,
  summary,
  responsibilities,
  requirements,
  default_access_role_id,
  default_assignment_permission_codes,
  default_operational_tags,
  volunteer_perks,
  pay_type,
  is_active,
  sort_order
)
select
  opportunity.id,
  opportunity.title,
  opportunity.role_code,
  opportunity.department,
  case when opportunity.opportunity_type = 'paid' then 'paid' else 'volunteer' end,
  opportunity.summary,
  case
    when coalesce(opportunity.description, '') = '' then '{}'::text[]
    else array[opportunity.description]
  end,
  case
    when opportunity.requirements is null then '{}'::text[]
    when jsonb_typeof(opportunity.requirements) = 'array'
      then array(select jsonb_array_elements_text(opportunity.requirements))
    else '{}'::text[]
  end,
  null::uuid,
  '{}'::text[],
  case
    when coalesce(opportunity.department, '') = '' then '{}'::text[]
    else array[regexp_replace(lower(opportunity.department), '[^a-z0-9]+', '_', 'g')]
  end,
  case
    when opportunity.perks is null then '{}'::text[]
    when jsonb_typeof(opportunity.perks) = 'array'
      then array(select jsonb_array_elements_text(opportunity.perks))
    else '{}'::text[]
  end,
  case
    when opportunity.pay_label ilike '%hour%' then 'hourly'
    when opportunity.pay_label ilike '%stipend%' then 'stipend'
    when coalesce(opportunity.pay_label, '') <> '' then 'fixed'
    else null
  end,
  opportunity.status <> 'archived',
  coalesce(opportunity.display_order, 100)
from epl.opportunities opportunity
on conflict (legacy_opportunity_id) do update
set
  title = excluded.title,
  role_code = excluded.role_code,
  department = excluded.department,
  role_type = excluded.role_type,
  summary = excluded.summary,
  responsibilities = excluded.responsibilities,
  requirements = excluded.requirements,
  default_access_role_id = excluded.default_access_role_id,
  default_assignment_permission_codes = excluded.default_assignment_permission_codes,
  default_operational_tags = excluded.default_operational_tags,
  volunteer_perks = excluded.volunteer_perks,
  pay_type = excluded.pay_type,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into epl.staff_positions (
  legacy_opportunity_id,
  role_template_id,
  season_id,
  city,
  state,
  position_status,
  visibility,
  slots_needed,
  slots_filled,
  priority,
  notes,
  publicly_listed,
  access_role_id,
  assignment_permission_codes,
  onboarding_notes,
  volunteer_perks,
  pay_type,
  created_at,
  updated_at
)
select
  opportunity.id,
  template.id,
  opportunity.season_id,
  opportunity.location_city,
  opportunity.location_state,
  case
    when opportunity.status = 'filled' then 'filled'
    when opportunity.status = 'closed' then 'closed'
    when opportunity.status = 'draft' then 'archived'
    else 'open'
  end,
  case when coalesce(opportunity.is_public, true) then 'public' else 'internal_only' end,
  1,
  0,
  coalesce(opportunity.priority_score, 100),
  opportunity.description,
  coalesce(opportunity.is_public, true),
  null::uuid,
  '{}'::text[],
  null::text,
  case
    when opportunity.perks is null then '{}'::text[]
    when jsonb_typeof(opportunity.perks) = 'array'
      then array(select jsonb_array_elements_text(opportunity.perks))
    else '{}'::text[]
  end,
  case
    when opportunity.pay_label ilike '%hour%' then 'hourly'
    when opportunity.pay_label ilike '%stipend%' then 'stipend'
    when coalesce(opportunity.pay_label, '') <> '' then 'fixed'
    else null
  end,
  opportunity.created_at,
  opportunity.updated_at
from epl.opportunities opportunity
join epl.staff_role_templates template on template.legacy_opportunity_id = opportunity.id
on conflict (legacy_opportunity_id) do update
set
  role_template_id = excluded.role_template_id,
  season_id = excluded.season_id,
  city = excluded.city,
  state = excluded.state,
  position_status = excluded.position_status,
  visibility = excluded.visibility,
  priority = excluded.priority,
  notes = excluded.notes,
  publicly_listed = excluded.publicly_listed,
  access_role_id = excluded.access_role_id,
  assignment_permission_codes = excluded.assignment_permission_codes,
  onboarding_notes = excluded.onboarding_notes,
  volunteer_perks = excluded.volunteer_perks,
  pay_type = excluded.pay_type,
  updated_at = excluded.updated_at;

insert into epl.staff_assignments (position_id, application_id, assignment_status, notes, created_at, updated_at)
select
  position.id,
  application.id,
  case
    when application.status in ('approved', 'hired') then 'confirmed'
    when application.status in ('interview', 'scheduled') then 'assigned'
    when application.status in ('rejected', 'withdrawn') then 'declined'
    else 'pending'
  end,
  application.why_join,
  application.created_at,
  application.updated_at
from epl.staff_applications application
join epl.staff_positions position on position.legacy_opportunity_id = application.opportunity_id
where application.opportunity_id is not null
on conflict do nothing;

update epl.staff_applications application
set
  position_id = position.id,
  role_template_id = position.role_template_id
from epl.staff_positions position
where application.opportunity_id = position.legacy_opportunity_id
  and (application.position_id is null or application.role_template_id is null);
