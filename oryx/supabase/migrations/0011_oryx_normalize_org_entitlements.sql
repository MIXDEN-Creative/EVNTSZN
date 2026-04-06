-- ORYX v11 (fixed): Normalize org_entitlements structure safely
-- This version avoids crashing if the unique relation already exists.

-- 0) Safety: remove any existing uniqueness relation by name (could be index or constraint)
do $$
begin
  -- Drop constraint if it exists
  if exists (
    select 1
    from pg_constraint
    where conname = 'org_entitlements_org_module_unique'
      and conrelid = 'public.org_entitlements'::regclass
  ) then
    alter table public.org_entitlements
      drop constraint org_entitlements_org_module_unique;
  end if;
exception when undefined_table then
  -- table may not exist yet in some dev sequences
  null;
end $$;

-- Drop index/relation if it exists (covers unique index cases)
drop index if exists public.org_entitlements_org_module_unique;

-- 1) Drop legacy entitlement_key column if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_entitlements'
      and column_name = 'entitlement_key'
  ) then
    alter table public.org_entitlements
      drop column entitlement_key;
  end if;
end $$;

-- 2) Ensure module_key exists and is NOT NULL
alter table public.org_entitlements
  add column if not exists module_key text;

alter table public.org_entitlements
  alter column module_key set not null;

-- 3) Ensure enabled exists
alter table public.org_entitlements
  add column if not exists enabled boolean not null default true;

-- 4) Ensure source exists
alter table public.org_entitlements
  add column if not exists source text not null default 'plan';

-- 5) Ensure timestamps exist
alter table public.org_entitlements
  add column if not exists created_at timestamptz not null default now();

alter table public.org_entitlements
  add column if not exists updated_at timestamptz not null default now();

-- 6) Ensure FK to module_catalog
do $$
begin
  begin
    alter table public.org_entitlements
      add constraint org_entitlements_module_key_fkey
      foreign key (module_key)
      references public.module_catalog(module_key)
      on delete cascade;
  exception when duplicate_object then
    null;
  end;
end $$;

-- 7) Recreate uniqueness per org/module (safe, after dropping any prior relation)
alter table public.org_entitlements
  add constraint org_entitlements_org_module_unique
  unique (org_id, module_key);
