-- Seed starter data for internal MIXDEN org (venue + event + group chat + messages + finance basics)
-- Safe to run multiple times (uses ON CONFLICT / existence checks).

do $$
declare
  mixden_org_id uuid;
  tk_user_id uuid := '960eb7e0-8e4b-4389-992c-36674b359a21';
  venue_id uuid;
  event_id uuid;
  convo_id uuid;
  plan_id uuid;
begin
  -- Find internal MIXDEN org
  select id into mixden_org_id
  from public.organizations
  where name='MIXDEN Creative' and is_internal=true
  order by created_at asc
  limit 1;

  if mixden_org_id is null then
    raise exception 'Internal org "MIXDEN Creative" not found.';
  end if;

  -- Ensure TK exists in auth/users + profile (in case dev seed migration got removed later)
  insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  values (tk_user_id, 'tk@oryx.local', '{}'::jsonb, '{"display_name":"TK"}'::jsonb, now(), now(), 'authenticated', 'authenticated')
  on conflict (id) do update
  set email=excluded.email, raw_user_meta_data=excluded.raw_user_meta_data, updated_at=now();

  insert into public.profiles (user_id, display_name)
  values (tk_user_id, 'TK')
  on conflict (user_id) do update
  set display_name=excluded.display_name;

  -- Ensure membership exists
  insert into public.org_memberships (org_id, user_id, is_active, created_at)
  values (mixden_org_id, tk_user_id, true, now())
  on conflict (org_id, user_id) do update
  set is_active=true;

  -- 1) Venue (idempotent by name within org)
  select v.id into venue_id
  from public.venues v
  where v.org_id=mixden_org_id and v.name='MIXDEN HQ Venue'
  limit 1;

  if venue_id is null then
    insert into public.venues (org_id, name, address_label)
    values (mixden_org_id, 'MIXDEN HQ Venue', '1201 Market St, Philadelphia, PA')
    returning id into venue_id;
  end if;

  -- 2) Event (idempotent by name within org)
  select e.id into event_id
  from public.events e
  where e.org_id=mixden_org_id and e.name='MIXDEN Launch Run-Through'
  limit 1;

  if event_id is null then
    insert into public.events (org_id, venue_id, name, starts_at, ends_at, status)
    values (
      mixden_org_id,
      venue_id,
      'MIXDEN Launch Run-Through',
      now() + interval '7 days',
      now() + interval '7 days' + interval '2 hours',
      'draft'
    )
    returning id into event_id;
  end if;

    -- 3) Messaging: group conversation + membership + a couple messages
  -- conversations schema: (org_id, convo_type, title, context_type, context_id)
  select c.id into convo_id
  from public.conversations c
  where c.org_id = mixden_org_id
    and c.convo_type = 'group'
    and coalesce(c.title,'') = 'MIXDEN Ops Chat'
  limit 1;

  if convo_id is null then
    insert into public.conversations (org_id, convo_type, title)
    values (mixden_org_id, 'group', 'MIXDEN Ops Chat')
    returning id into convo_id;
  end if;

  -- Ensure TK is a member of the conversation
  insert into public.conversation_members (conversation_id, user_id)
  values (convo_id, tk_user_id)
  on conflict do nothing;

  -- Seed messages if none exist
  if not exists (
    select 1
    from public.messages m
    where m.org_id = mixden_org_id
      and m.conversation_id = convo_id
  ) then
    insert into public.messages (org_id, conversation_id, sender_user_id, body, message_kind, meta)
    values
      (mixden_org_id, convo_id, tk_user_id, 'Welcome to ORYX. This is the MIXDEN Ops Chat.', 'standard', '{}'::jsonb),
      (mixden_org_id, convo_id, tk_user_id, 'Next: build the UI and wire it to these tables.', 'standard', '{}'::jsonb);
  end if;

  -- Optional: seed a DM conversation too (convo_type = 'dm')
  -- This creates a DM with just TK as the only member for now.
  -- Later you can add a second user in another seed.
  declare dm_convo_id uuid;
  begin
    select c.id into dm_convo_id
    from public.conversations c
    where c.org_id = mixden_org_id
      and c.convo_type = 'dm'
      and coalesce(c.title,'') = 'TK Inbox'
    limit 1;

    if dm_convo_id is null then
      insert into public.conversations (org_id, convo_type, title)
      values (mixden_org_id, 'dm', 'TK Inbox')
      returning id into dm_convo_id;
    end if;

    insert into public.conversation_members (conversation_id, user_id)
    values (dm_convo_id, tk_user_id)
    on conflict do nothing;

    if not exists (
      select 1 from public.messages m
      where m.org_id=mixden_org_id and m.conversation_id=dm_convo_id
    ) then
      insert into public.messages (org_id, conversation_id, sender_user_id, body)
      values (mixden_org_id, dm_convo_id, tk_user_id, 'This is your inbox thread.');
    end if;
  end;
   

  -- 4) Finance: commission plan + a baseline rate
  select cp.id into plan_id
  from public.commission_plans cp
  where cp.org_id=mixden_org_id and cp.plan_name='Default Commission Plan'
  limit 1;

  if plan_id is null then
    insert into public.commission_plans (org_id, plan_name)
    values (mixden_org_id, 'Default Commission Plan')
    returning id into plan_id;
  end if;

  -- Insert a baseline commission rate if your table supports it
  -- NOTE: adjust columns if needed; this is a common shape: (plan_id, role_key, rate_bps or rate_pct)
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='commission_rates' and column_name='plan_id'
  ) then
    -- Try a couple common column patterns safely
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='commission_rates' and column_name='rate_bps'
    ) then
      insert into public.commission_rates (org_id, plan_id, role_key, rate_bps)
      select mixden_org_id, plan_id, 'sales_rep', 1000
      where not exists (
        select 1 from public.commission_rates r
        where r.org_id=mixden_org_id and r.plan_id=plan_id and r.role_key='sales_rep'
      );
    elsif exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='commission_rates' and column_name='rate_pct'
    ) then
      insert into public.commission_rates (org_id, plan_id, role_key, rate_pct)
      select mixden_org_id, plan_id, 'sales_rep', 10
      where not exists (
        select 1 from public.commission_rates r
        where r.org_id=mixden_org_id and r.plan_id=plan_id and r.role_key='sales_rep'
      );
    end if;
  end if;

end $$;
