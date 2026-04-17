create table if not exists public.evntszn_pulse_posts (
  id uuid primary key default gen_random_uuid(),
  visibility text not null default 'public' check (visibility in ('public', 'internal')),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  title text not null,
  body text not null,
  city text,
  source_type text,
  source_label text,
  pulse_score numeric(4, 1),
  reservation_signal text,
  sponsor_account_id uuid references public.evntszn_sponsor_accounts (id) on delete set null,
  created_by_user_id uuid,
  is_featured boolean not null default false,
  bolt_only boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_pulse_posts_visibility_idx
  on public.evntszn_pulse_posts (visibility, status, created_at desc);

drop trigger if exists evntszn_pulse_posts_set_updated_at on public.evntszn_pulse_posts;
create trigger evntszn_pulse_posts_set_updated_at
before update on public.evntszn_pulse_posts
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_message_threads (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null check (thread_type in ('public', 'internal')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  subject text not null,
  created_by_user_id uuid,
  owner_user_id uuid,
  assigned_to_user_id uuid,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_message_threads_type_idx
  on public.evntszn_message_threads (thread_type, status, updated_at desc);

drop trigger if exists evntszn_message_threads_set_updated_at on public.evntszn_message_threads;
create trigger evntszn_message_threads_set_updated_at
before update on public.evntszn_message_threads
for each row execute function public.set_updated_at();

create table if not exists public.evntszn_thread_participants (
  thread_id uuid not null references public.evntszn_message_threads (id) on delete cascade,
  user_id uuid not null,
  role_label text,
  is_internal boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (thread_id, user_id)
);

create index if not exists evntszn_thread_participants_user_idx
  on public.evntszn_thread_participants (user_id, created_at desc);

create table if not exists public.evntszn_thread_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.evntszn_message_threads (id) on delete cascade,
  sender_user_id uuid,
  sender_label text,
  body text not null,
  is_internal boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists evntszn_thread_messages_thread_idx
  on public.evntszn_thread_messages (thread_id, created_at asc);
