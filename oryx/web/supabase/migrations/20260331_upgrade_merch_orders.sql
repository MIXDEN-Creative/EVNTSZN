alter table public.merch_orders
  add column if not exists markup_amount integer default 0,
  add column if not exists base_amount integer default 0,
  add column if not exists refund_amount integer default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists notes text,
  add column if not exists email_sent boolean not null default false,
  add column if not exists email_sent_at timestamptz,
  add column if not exists fulfillment_attempts integer not null default 0;

create index if not exists merch_orders_fulfillment_status_idx
  on public.merch_orders(fulfillment_status);

create index if not exists merch_orders_created_at_idx
  on public.merch_orders(created_at desc);
