-- ORYX v8: Internal org billing bypass + allowlist helper

create or replace function public.is_allowlisted_internal_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.internal_access_allowlist a
    where a.user_id = auth.uid()
  );
$$;

create or replace function public.apply_free_minutes_and_compute_billable(target_org uuid, target_month_start date)
returns void
language plpgsql
as $$
declare
  month_end date := (target_month_start + interval '1 month')::date;
  total_minutes numeric(18,4);
  free_alloc int;
  free_used numeric(18,4);
  billable_minutes numeric(18,4);
  rate numeric(12,6);
  currency_code text;
  billable_amount numeric(18,2);
  internal_org boolean;
begin
  select coalesce(o.is_internal,false)
    into internal_org
  from public.organizations o
  where o.id = target_org;

  perform public.ensure_pool_month(target_month_start);

  select overage_rate, currency into rate, currency_code
  from public.platform_usage_pool
  where id = true;

  select coalesce(sum(e.participant_minutes),0)
    into total_minutes
  from public.video_usage_events e
  where e.org_id = target_org
    and e.created_at >= target_month_start::timestamptz
    and e.created_at < month_end::timestamptz;

  select coalesce(a.allocated_minutes,0), coalesce(a.consumed_minutes,0)
    into free_alloc, free_used
  from public.org_free_minutes_allocations a
  where a.org_id = target_org
    and a.month_start = target_month_start;

  free_used := least(total_minutes, free_alloc::numeric);

  if internal_org then
    billable_minutes := 0;
    billable_amount := 0;
  else
    billable_minutes := greatest(total_minutes - free_used, 0);
    billable_amount := round((billable_minutes * rate)::numeric, 2);
  end if;

  insert into public.org_free_minutes_allocations (org_id, month_start, allocated_minutes, consumed_minutes)
  values (target_org, target_month_start, free_alloc, free_used)
  on conflict (org_id, month_start) do update
    set consumed_minutes = excluded.consumed_minutes,
        updated_at = now();

  insert into public.org_usage_monthly (org_id, month_start, participant_minutes, included_minutes, overage_minutes, overage_amount, currency, last_calculated_at)
  values (target_org, target_month_start, total_minutes, free_alloc, billable_minutes, billable_amount, currency_code, now())
  on conflict (org_id, month_start) do update
    set participant_minutes = excluded.participant_minutes,
        included_minutes = excluded.included_minutes,
        overage_minutes = excluded.overage_minutes,
        overage_amount = excluded.overage_amount,
        currency = excluded.currency,
        last_calculated_at = now();

  update public.platform_usage_pool_monthly
    set consumed_free_minutes = (
      select coalesce(sum(consumed_minutes),0)
      from public.org_free_minutes_allocations
      where month_start = target_month_start
    ),
    updated_at = now()
  where month_start = target_month_start;
end;
$$;
