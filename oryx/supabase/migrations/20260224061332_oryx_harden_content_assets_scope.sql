begin;

-- 0) Helpful composite uniques so other tables can FK (id, org_id) safely
create unique index if not exists content_assets_id_org_id_uq
on public.content_assets (id, org_id);

create unique index if not exists artists_id_org_id_uq
on public.artists (id, org_id);

create unique index if not exists conversations_id_org_id_uq
on public.conversations (id, org_id);

create unique index if not exists events_id_org_id_uq
on public.events (id, org_id);

-- 1) Validate scope_type values with a CHECK constraint
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'content_assets_scope_type_check'
      and conrelid = 'public.content_assets'::regclass
  ) then
    alter table public.content_assets
      add constraint content_assets_scope_type_check
      check (scope_type in ('org','artist','event','conversation'));
  end if;
end $$;

-- 2) Trigger function to enforce scope_id presence and org matching
create or replace function public.oryx_validate_content_asset_scope()
returns trigger
language plpgsql
as $$
begin
  -- Normalize blanks
  if new.scope_type is null or btrim(new.scope_type) = '' then
    raise exception 'content_assets.scope_type is required';
  end if;

  -- org-scoped assets
  if new.scope_type = 'org' then
    -- allow scope_id null, or require it match org_id (stricter)
    if new.scope_id is not null and new.scope_id <> new.org_id then
      raise exception 'content_assets.scope_id must be null or equal org_id when scope_type=org';
    end if;
    return new;
  end if;

  -- non-org scopes must have a scope_id
  if new.scope_id is null then
    raise exception 'content_assets.scope_id is required when scope_type=%', new.scope_type;
  end if;

  -- artist scope must match org
  if new.scope_type = 'artist' then
    if not exists (
      select 1
      from public.artists a
      where a.id = new.scope_id
        and a.org_id = new.org_id
    ) then
      raise exception 'Invalid artist scope: artist % is not in org %', new.scope_id, new.org_id;
    end if;
    return new;
  end if;

  -- event scope must match org
  if new.scope_type = 'event' then
    if not exists (
      select 1
      from public.events e
      where e.id = new.scope_id
        and e.org_id = new.org_id
    ) then
      raise exception 'Invalid event scope: event % is not in org %', new.scope_id, new.org_id;
    end if;
    return new;
  end if;

  -- conversation scope must match org
  if new.scope_type = 'conversation' then
    if not exists (
      select 1
      from public.conversations c
      where c.id = new.scope_id
        and c.org_id = new.org_id
    ) then
      raise exception 'Invalid conversation scope: conversation % is not in org %', new.scope_id, new.org_id;
    end if;
    return new;
  end if;

  -- Fallback if we ever add new scope types and forget to update this function
  raise exception 'Unsupported scope_type: %', new.scope_type;
end;
$$;

-- 3) Attach trigger (idempotent)
do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'trg_oryx_validate_content_asset_scope'
      and tgrelid = 'public.content_assets'::regclass
  ) then
    drop trigger trg_oryx_validate_content_asset_scope on public.content_assets;
  end if;

  create trigger trg_oryx_validate_content_asset_scope
  before insert or update on public.content_assets
  for each row
  execute function public.oryx_validate_content_asset_scope();
end $$;

commit;
