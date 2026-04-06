-- Prevent duplicate internal orgs with same name
create unique index if not exists organizations_internal_name_unique
on public.organizations (name)
where is_internal = true;
