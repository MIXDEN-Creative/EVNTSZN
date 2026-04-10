create table if not exists public.city_offices (
  id uuid primary key default gen_random_uuid(),
  office_name text not null,
  city text not null,
  state text,
  region text,
  office_status text not null default 'active',
  office_lead_user_id uuid references auth.users(id) on delete set null,
  notes text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_offices_city_idx on public.city_offices (city);
create index if not exists city_offices_status_idx on public.city_offices (office_status);

create or replace function public.touch_city_offices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists city_offices_touch_updated_at on public.city_offices;
create trigger city_offices_touch_updated_at
before update on public.city_offices
for each row
execute function public.touch_city_offices_updated_at();
