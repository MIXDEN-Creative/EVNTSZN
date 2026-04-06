create table if not exists public.merch_storefront_catalog (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  printful_product_id bigint not null unique,
  title_override text,
  subtitle text,
  category text,
  badge text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_featured boolean not null default false
);

create index if not exists merch_storefront_catalog_sort_idx
  on public.merch_storefront_catalog(sort_order asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists merch_storefront_catalog_set_updated_at on public.merch_storefront_catalog;

create trigger merch_storefront_catalog_set_updated_at
before update on public.merch_storefront_catalog
for each row
execute function public.set_updated_at();
