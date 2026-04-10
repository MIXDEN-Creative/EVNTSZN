alter table public.evntszn_sponsor_package_orders
  add column if not exists assigned_reviewer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists review_stage text not null default 'new',
  add column if not exists review_notes text;

create index if not exists evntszn_sponsor_package_orders_review_stage_idx
  on public.evntszn_sponsor_package_orders(review_stage, created_at desc);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'support_tickets'
  ) then
    alter table public.support_tickets
      add column if not exists linked_city text,
      add column if not exists linked_office_label text;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'support_tickets'
  ) then
    create index if not exists support_tickets_status_severity_idx
      on public.support_tickets(status, severity, updated_at desc);
  end if;
end $$;

alter table public.workforce_pay_periods
  add column if not exists overtime_daily_threshold_hours numeric(6,2) not null default 8,
  add column if not exists overtime_weekly_threshold_hours numeric(6,2) not null default 40;

alter table public.workforce_time_entries
  add column if not exists regular_minutes integer not null default 0,
  add column if not exists overtime_minutes integer not null default 0,
  add column if not exists exported_at timestamptz,
  add column if not exists export_batch text;

create index if not exists workforce_time_entries_status_period_idx
  on public.workforce_time_entries(pay_period_id, status, created_at desc);

alter table epl.staff_role_templates
  add column if not exists access_track text not null default 'none';

alter table epl.staff_positions
  add column if not exists access_track text not null default 'none';
