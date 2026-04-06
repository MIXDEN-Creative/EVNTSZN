-- Create internal MIXDEN org if missing (idempotent)

do $$
begin
  if not exists (
    select 1
    from public.organizations
    where name='MIXDEN Creative'
      and is_internal=true
  ) then
    insert into public.organizations (name, is_internal)
values ('MIXDEN Creative', true)
on conflict do nothing;
  end if;
end $$;
