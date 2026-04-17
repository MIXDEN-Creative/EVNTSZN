alter table public.evntszn_ticket_types
  alter column price_usd type numeric(10,2) using round(price_usd::numeric, 2),
  alter column price_usd set default 0;

alter table public.evntszn_ticket_orders
  alter column amount_total_usd type numeric(10,2) using round(amount_total_usd::numeric, 2),
  alter column amount_total_usd set default 0;

alter table public.evntszn_link_pages
  alter column monthly_price_usd type numeric(10,2) using round(monthly_price_usd::numeric, 2);

alter table public.evntszn_link_plan_offers
  alter column fee_amount_usd type numeric(10,2) using round(fee_amount_usd::numeric, 2);

alter table public.evntszn_crew_profiles
  alter column rate_amount_usd type numeric(10,2) using round(rate_amount_usd::numeric, 2),
  alter column booking_fee_usd type numeric(10,2) using round(booking_fee_usd::numeric, 2);

alter table public.evntszn_link_conversions
  alter column attributed_gross_revenue_usd type numeric(10,2) using round(attributed_gross_revenue_usd::numeric, 2),
  alter column attributed_gross_revenue_usd set default 0;

alter table public.evntszn_sponsor_package_orders
  alter column amount_usd type numeric(10,2) using round(amount_usd::numeric, 2),
  alter column amount_usd set default 0;

alter table public.evntszn_workforce_shifts
  alter column pay_amount_usd type numeric(10,2) using round(pay_amount_usd::numeric, 2);

alter table public.evntszn_reserve_bookings
  add column if not exists requested_status text,
  add column if not exists seated_at timestamptz,
  add column if not exists source_channel text not null default 'reserve',
  add column if not exists revenue_amount_usd numeric(10,2) not null default 0,
  add column if not exists attended_guest_count integer not null default 0;

alter table epl.seasons
  alter column player_fee_usd type numeric(10,2) using round(player_fee_usd::numeric, 2),
  alter column player_fee_usd set default 95;

alter table epl.season_registrations
  alter column payment_amount_usd type numeric(10,2) using round(payment_amount_usd::numeric, 2),
  alter column payment_amount_usd set default 95;

alter table epl.staff_assignments
  alter column pay_rate_usd type numeric(10,2) using round(pay_rate_usd::numeric, 2),
  alter column stipend_usd type numeric(10,2) using round(stipend_usd::numeric, 2);

alter table epl.sponsorship_packages
  alter column cash_price_usd type numeric(10,2) using round(cash_price_usd::numeric, 2),
  alter column in_kind_floor_usd type numeric(10,2) using round(in_kind_floor_usd::numeric, 2);

alter table epl.sponsor_partners
  alter column cash_value_usd type numeric(10,2) using round(cash_value_usd::numeric, 2),
  alter column in_kind_value_usd type numeric(10,2) using round(in_kind_value_usd::numeric, 2);

alter table epl.revenue_items
  alter column amount_usd type numeric(10,2) using round(amount_usd::numeric, 2);

alter table epl.merch_catalog
  alter column price_usd type numeric(10,2) using round(price_usd::numeric, 2);

alter table epl.merch_sales
  alter column gross_amount_usd type numeric(10,2) using round(gross_amount_usd::numeric, 2),
  alter column cost_amount_usd type numeric(10,2) using round(cost_amount_usd::numeric, 2);

alter table epl.add_on_catalog
  alter column price_usd type numeric(10,2) using round(price_usd::numeric, 2);
