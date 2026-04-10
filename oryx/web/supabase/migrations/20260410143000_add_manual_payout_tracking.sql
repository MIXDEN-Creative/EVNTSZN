create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  recipient_type text not null,
  recipient_label text,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'void')),
  method text not null default 'manual' check (method in ('manual')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payout_ledger_links (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  ledger_id uuid not null references public.revenue_ledger(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists payout_ledger_links_active_ledger_unique
  on public.payout_ledger_links (ledger_id)
  where released_at is null;

create index if not exists payouts_status_created_idx on public.payouts (status, created_at desc);
create index if not exists payouts_user_created_idx on public.payouts (user_id, created_at desc);
create index if not exists payout_ledger_links_payout_idx on public.payout_ledger_links (payout_id, created_at asc);
