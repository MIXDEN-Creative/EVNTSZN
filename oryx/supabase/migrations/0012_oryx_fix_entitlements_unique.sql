-- ORYX v12: Fix duplicate unique relation for org_entitlements

-- 1) Drop the unique constraint if it exists (by name)
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'org_entitlements_org_module_unique'
      and conrelid = 'public.org_entitlements'::regclass
  ) then
    alter table public.org_entitlements
      drop constraint org_entitlements_org_module_unique;
  end if;
end $$;

-- 2) Drop an index with the same name if it exists (sometimes created separately)
drop index if exists public.org_entitlements_org_module_unique;

-- 3) Recreate the uniqueness constraint with the same intended meaning
alter table public.org_entitlements
  add constraint org_entitlements_org_module_unique
  unique (org_id, module_key);
