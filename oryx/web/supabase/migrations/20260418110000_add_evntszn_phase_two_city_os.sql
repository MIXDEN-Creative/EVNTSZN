alter table public.evntszn_venues
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.evntszn_reserve_bookings
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_status text not null default 'unpaid'
    check (stripe_payment_status in ('unpaid', 'pending', 'paid', 'canceled', 'failed'));

create index if not exists evntszn_reserve_bookings_checkout_idx
  on public.evntszn_reserve_bookings (stripe_checkout_session_id);

comment on table public.evntszn_profiles is 'User identity layer for EVNTSZN city operating system.';
comment on table public.evntszn_venues is 'Venue supply entry with Smart Fill and link metadata stored in metadata.';
comment on table public.evntszn_reserve_bookings is 'Reserve bookings and paid hold records for EVNTSZN Reserve.';
comment on table public.evntszn_crew_booking_requests is 'Crew marketplace request intake with fee logic stored in metadata.';
comment on table public.evntszn_link_pages is 'Public identity pages for partners, venues, and future curators.';
comment on table public.evntszn_nodes is 'Destination handlers for NFC-style node routing.';
