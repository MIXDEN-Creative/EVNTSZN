do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'permissions'
  ) then
    insert into public.permissions (code, label, description, category, is_system)
    values
      ('workforce.view', 'View Workforce', 'View workforce time and pay data', 'workforce', true),
      ('workforce.manage', 'Manage Workforce', 'Manage workforce time and pay operations', 'workforce', true),
      ('workforce.approve', 'Approve Workforce', 'Approve and finalize workforce time entries', 'workforce', true)
    on conflict (code) do update
    set
      label = excluded.label,
      description = excluded.description,
      category = excluded.category,
      is_system = excluded.is_system;
  end if;
end $$;

create table if not exists public.workforce_pay_periods (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  period_type text not null check (period_type in ('hourly', 'daily', 'weekly', 'monthly')),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'locked', 'exported')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workforce_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  staff_assignment_id uuid references epl.staff_assignments(id) on delete set null,
  staff_position_id uuid references epl.staff_positions(id) on delete set null,
  pay_period_id uuid references public.workforce_pay_periods(id) on delete set null,
  linked_event_id uuid references public.evntszn_events(id) on delete set null,
  scope_type text,
  scope_label text,
  city text,
  office_label text,
  pay_type text not null default 'hourly' check (pay_type in ('hourly', 'daily', 'weekly', 'monthly', 'stipend', 'fixed')),
  employment_type text check (employment_type in ('full_time', 'part_time', 'seasonal', 'event_based')),
  pay_amount_cents integer,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'corrected', 'ready_for_payroll')),
  started_at timestamptz,
  ended_at timestamptz,
  break_started_at timestamptz,
  break_ended_at timestamptz,
  break_minutes integer not null default 0,
  minutes_worked integer not null default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  source text not null default 'manual',
  notes text,
  manager_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workforce_time_entries_user_idx on public.workforce_time_entries (user_id, created_at desc);
create index if not exists workforce_time_entries_status_idx on public.workforce_time_entries (status);
create index if not exists workforce_time_entries_position_idx on public.workforce_time_entries (staff_position_id);
create index if not exists workforce_time_entries_assignment_idx on public.workforce_time_entries (staff_assignment_id);

insert into public.workforce_pay_periods (label, period_type, starts_on, ends_on, status, notes)
select
  to_char(current_date, '"Week of" Mon DD, YYYY'),
  'weekly',
  date_trunc('week', current_date)::date,
  (date_trunc('week', current_date)::date + interval '6 days')::date,
  'open',
  'Auto-seeded weekly workforce period.'
where not exists (
  select 1
  from public.workforce_pay_periods
  where starts_on = date_trunc('week', current_date)::date
    and ends_on = (date_trunc('week', current_date)::date + interval '6 days')::date
);
