create extension if not exists pgcrypto;

create table if not exists public.merch_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  stripe_session_id text unique,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,

  product_name text,
  printful_product_id bigint,
  printful_variant_id bigint,
  quantity integer not null default 1,
  amount_total integer,
  base_amount integer default 0,
  markup_amount integer default 0,

  currency text default 'usd',
  status text not null default 'pending',
  fulfillment_status text not null default 'not_sent',
  fulfillment_attempts integer not null default 0,

  recipient_name text,
  address1 text,
  address2 text,
  city text,
  state_code text,
  country_code text,
  zip text,

  refund_amount integer default 0,
  refunded_at timestamptz,
  canceled_at timestamptz,
  notes text,

  email_sent boolean not null default false,
  email_sent_at timestamptz,

  printful_order_id bigint,
  printful_order_data jsonb,
  stripe_data jsonb
);

create index if not exists merch_orders_status_idx
  on public.merch_orders(status);

create index if not exists merch_orders_fulfillment_status_idx
  on public.merch_orders(fulfillment_status);

create index if not exists merch_orders_customer_email_idx
  on public.merch_orders(customer_email);

create index if not exists merch_orders_created_at_idx
  on public.merch_orders(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists merch_orders_set_updated_at on public.merch_orders;

create trigger merch_orders_set_updated_at
before update on public.merch_orders
for each row
execute function public.set_updated_at();
