import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { roundUsd } from "@/lib/money";
import { refreshPerformanceSnapshot } from "@/lib/performance-engine";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const RESERVE_BOOKING_STATUSES = [
  "confirmed",
  "waitlisted",
  "checked_in",
  "no_show",
  "cancelled",
] as const;

export type ReserveVenueSettings = {
  cuisine?: string | null;
  neighborhood?: string | null;
  reservation_fee_usd?: number | null;
  average_check_usd?: number | null;
  booking_window_days?: number | null;
  max_party_size?: number | null;
  waitlist_enabled?: boolean;
  dining_enabled?: boolean;
  nightlife_enabled?: boolean;
  service_modes?: string[];
  seating_notes?: string | null;
};

type ReserveVenueRow = {
  id: string;
  venue_id: string;
  is_active: boolean;
  settings: ReserveVenueSettings | null;
  evntszn_venues?: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    timezone: string;
    owner_user_id: string | null;
  } | {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    timezone: string;
    owner_user_id: string | null;
  }[] | null;
};

export function normalizeReserveSettings(settings: Record<string, unknown> | null | undefined): ReserveVenueSettings {
  const value = settings || {};
  const serviceModes = Array.isArray(value.service_modes) ? value.service_modes.map(String).filter(Boolean) : [];

  return {
    cuisine: value.cuisine ? String(value.cuisine).trim() : null,
    neighborhood: value.neighborhood ? String(value.neighborhood).trim() : null,
    reservation_fee_usd:
      value.reservation_fee_usd !== undefined && value.reservation_fee_usd !== null
        ? roundUsd(Number(value.reservation_fee_usd))
        : null,
    average_check_usd:
      value.average_check_usd !== undefined && value.average_check_usd !== null
        ? roundUsd(Number(value.average_check_usd))
        : null,
    booking_window_days:
      value.booking_window_days !== undefined && value.booking_window_days !== null
        ? Math.max(1, Number(value.booking_window_days))
        : 30,
    max_party_size:
      value.max_party_size !== undefined && value.max_party_size !== null
        ? Math.max(1, Number(value.max_party_size))
        : 8,
    waitlist_enabled: value.waitlist_enabled !== false,
    dining_enabled: value.dining_enabled !== false,
    nightlife_enabled: value.nightlife_enabled !== false,
    service_modes: serviceModes.length ? serviceModes : ["dining", "nightlife"],
    seating_notes: value.seating_notes ? String(value.seating_notes).trim() : null,
  };
}

export async function getReserveVenueBySlug(venueSlug: string) {
  const { data, error } = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
    .eq("evntszn_venues.slug", venueSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ReserveVenueRow | null;
}

export async function getReserveVenueForOwner(userId: string, reserveVenueId: string) {
  const { data, error } = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
    .eq("id", reserveVenueId)
    .eq("evntszn_venues.owner_user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ReserveVenueRow | null;
}

export function unwrapVenue(row: ReserveVenueRow | null | undefined) {
  if (!row?.evntszn_venues) return null;
  return Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] || null : row.evntszn_venues;
}

export function getBookingDayOfWeek(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCDay();
}

export function isTimeWithinSlot(timeValue: string, startTime: string, endTime: string) {
  return timeValue >= startTime && timeValue < endTime;
}

export async function syncReservePerformance(ownerUserId: string | null | undefined) {
  if (!ownerUserId) return;
  await Promise.allSettled([
    refreshPerformanceSnapshot("reserve", ownerUserId),
    refreshPerformanceSnapshot("venue", ownerUserId),
  ]);
}

export async function createReserveWorkItem(input: {
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  payload?: Record<string, unknown>;
}) {
  return createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.reserve,
    title: input.title,
    description: input.description || null,
    priority: input.priority || "medium",
    payload: input.payload || {},
  });
}
