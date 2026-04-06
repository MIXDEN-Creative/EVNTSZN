-- ORYX v8: Internal allowlist table + org internal flag
-- Must exist before 0009 creates functions referencing it.

alter table public.organizations
add column if not exists is_internal boolean not null default false;

create table if not exists public.internal_access_allowlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
