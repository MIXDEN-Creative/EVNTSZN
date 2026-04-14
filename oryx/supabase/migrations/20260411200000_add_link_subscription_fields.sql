alter table public.evntszn_link_pages
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists evntszn_link_pages_stripe_customer_idx
  on public.evntszn_link_pages(stripe_customer_id);

create index if not exists evntszn_link_pages_stripe_subscription_idx
  on public.evntszn_link_pages(stripe_subscription_id);
