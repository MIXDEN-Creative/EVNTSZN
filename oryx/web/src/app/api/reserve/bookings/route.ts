import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  createReserveWorkItem,
  getBookingDayOfWeek,
  getReserveVenueBySlug,
  getReserveVenueForOwner,
  isTimeWithinSlot,
  normalizeReserveSettings,
  RESERVE_BOOKING_STATUSES,
  syncReservePerformance,
  unwrapVenue,
} from "@/lib/reserve";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const desk = request.nextUrl.searchParams.get("desk") === "1";
    const reserveVenueId = request.nextUrl.searchParams.get("reserveVenueId")?.trim();
    const status = request.nextUrl.searchParams.get("status")?.trim();

    if (desk) {
      await requireAdminPermission("admin.manage", "/epl/admin/control-center");
      let query = supabaseAdmin
        .from("evntszn_reserve_bookings")
        .select("id, reserve_venue_id, guest_name, guest_email, guest_phone, booking_date, booking_time, party_size, status, internal_notes, metadata, created_at")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true })
        .limit(200);
      if (reserveVenueId) query = query.eq("reserve_venue_id", reserveVenueId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return NextResponse.json({ bookings: data || [] });
    }

    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: ownedReserveVenues, error: venueError } = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, evntszn_venues!inner(owner_user_id)")
      .eq("evntszn_venues.owner_user_id", user.id);
    if (venueError) throw new Error(venueError.message);

    const allowedReserveVenueIds = (ownedReserveVenues || []).map((row) => row.id);
    if (!allowedReserveVenueIds.length) return NextResponse.json({ bookings: [] });

    let query = supabaseAdmin
      .from("evntszn_reserve_bookings")
      .select("id, reserve_venue_id, guest_name, guest_email, guest_phone, booking_date, booking_time, party_size, status, internal_notes, metadata, created_at")
      .in("reserve_venue_id", reserveVenueId ? [reserveVenueId] : allowedReserveVenueIds)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(200);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ bookings: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Reserve bookings." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const reserveVenueId = String(body.reserveVenueId || "").trim();
    const venueSlug = String(body.venueSlug || "").trim();
    const guestName = String(body.guestName || "").trim();
    const guestEmail = String(body.guestEmail || "").trim().toLowerCase();
    const guestPhone = String(body.guestPhone || "").trim() || null;
    const bookingDate = String(body.bookingDate || "").trim();
    const bookingTime = String(body.bookingTime || "").trim();
    const partySize = Math.max(1, Number(body.partySize || 1));
    const occasion = String(body.occasion || "").trim() || null;
    const internalNotes = String(body.internalNotes || "").trim() || null;

    if (!guestName || !guestEmail || !bookingDate || !bookingTime) {
      return NextResponse.json({ error: "Guest name, email, booking date, and booking time are required." }, { status: 400 });
    }

    let reserveVenue: any = null;
    if (reserveVenueId) {
      const reserveVenueRes = await supabaseAdmin
        .from("evntszn_reserve_venues")
        .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
        .eq("id", reserveVenueId)
        .maybeSingle();
      if (reserveVenueRes.error) throw new Error(reserveVenueRes.error.message);
      reserveVenue = reserveVenueRes.data as any;
    }
    if (!reserveVenue && venueSlug) reserveVenue = (await getReserveVenueBySlug(venueSlug)) as any;
    if (!reserveVenue) return NextResponse.json({ error: "Reserve venue not found." }, { status: 404 });
    if (!reserveVenue.is_active) return NextResponse.json({ error: "Reserve is not active for this venue." }, { status: 409 });

    const venue = unwrapVenue(reserveVenue);
    const settings = normalizeReserveSettings((reserveVenue.settings || {}) as Record<string, unknown>);
    if (partySize > Number(settings.max_party_size || 8)) {
      return NextResponse.json({ error: `Party size exceeds the venue limit of ${settings.max_party_size}.` }, { status: 400 });
    }

    const dayOfWeek = getBookingDayOfWeek(bookingDate);
    if (dayOfWeek === null) return NextResponse.json({ error: "Booking date is invalid." }, { status: 400 });

    const { data: slots, error: slotError } = await supabaseAdmin
      .from("evntszn_reserve_slots")
      .select("id, start_time, end_time, capacity_limit, is_active")
      .eq("reserve_venue_id", reserveVenue.id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time", { ascending: true });
    if (slotError) throw new Error(slotError.message);

    const matchingSlot = (slots || []).find((slot) => isTimeWithinSlot(bookingTime, slot.start_time, slot.end_time));
    if (!matchingSlot) {
      return NextResponse.json({ error: "No active Reserve slot is configured for that date and time." }, { status: 409 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .select("id, party_size, status")
      .eq("reserve_venue_id", reserveVenue.id)
      .eq("booking_date", bookingDate)
      .eq("booking_time", bookingTime)
      .in("status", ["confirmed", "checked_in"]);
    if (existingError) throw new Error(existingError.message);

    const committedSeats = (existing || []).reduce((sum, row) => sum + Number(row.party_size || 0), 0);
    const statusValue =
      committedSeats + partySize <= Number(matchingSlot.capacity_limit || 0)
        ? "confirmed"
        : settings.waitlist_enabled
          ? "waitlisted"
          : null;
    if (!statusValue) return NextResponse.json({ error: "That slot is full and waitlist is disabled." }, { status: 409 });

    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .insert({
        reserve_venue_id: reserveVenue.id,
        user_id: user?.id || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        party_size: partySize,
        status: statusValue,
        internal_notes: internalNotes,
        source_channel: "reserve",
        revenue_amount_usd: Number(settings.reservation_fee_usd || 0),
        metadata: {
          source: "reserve_public_booking",
          occasion,
          reservationFeeUsd: Number(settings.reservation_fee_usd || 0),
          serviceModes: settings.service_modes || [],
        },
      })
      .select("id, reserve_venue_id, guest_name, guest_email, booking_date, booking_time, party_size, status, metadata")
      .single();
    if (error) throw new Error(error.message);

    await createReserveWorkItem({
      title: `${statusValue === "waitlisted" ? "Reserve waitlist" : "Reserve booking"} · ${venue?.name || "Venue"}`,
      description: `${guestName} requested ${bookingDate} at ${bookingTime} for ${partySize}.`,
      priority: statusValue === "waitlisted" ? "high" : "medium",
      payload: {
        source: "reserve_booking",
        reserveVenueId: reserveVenue.id,
        venueId: reserveVenue.venue_id,
        bookingId: data.id,
      },
    });
    await syncReservePerformance(venue?.owner_user_id);

    return NextResponse.json({ ok: true, booking: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create Reserve booking." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    const isAdminOnly = !user;
    if (isAdminOnly) {
      await requireAdminPermission("admin.manage", "/admin/reserve-desk");
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const bookingId = String(body.id || "").trim();
    const statusValue = String(body.status || "").trim();
    if (!bookingId || !RESERVE_BOOKING_STATUSES.includes(statusValue as never)) {
      return NextResponse.json({ error: "Booking id and a valid status are required." }, { status: 400 });
    }

    const { data: bookingRow, error: bookingError } = await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .select("id, reserve_venue_id, guest_name, booking_date, booking_time, status, metadata")
      .eq("id", bookingId)
      .maybeSingle();
    if (bookingError) throw new Error(bookingError.message);
    if (!bookingRow) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const reserveVenue: any = isAdminOnly
      ? await supabaseAdmin
          .from("evntszn_reserve_venues")
          .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
          .eq("id", bookingRow.reserve_venue_id)
          .maybeSingle()
          .then((res) => {
            if (res.error) throw new Error(res.error.message);
            return res.data;
          })
      : await getReserveVenueForOwner(user!.id, bookingRow.reserve_venue_id);
    if (!reserveVenue) return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });

    const patch: Record<string, unknown> = { status: statusValue };
    if (body.internalNotes !== undefined) patch.internal_notes = String(body.internalNotes || "").trim() || null;
    if (statusValue === "checked_in") {
      patch.seated_at = new Date().toISOString();
      patch.attended_guest_count = Number(body.attendedGuestCount || 0) || undefined;
    }
    if (body.metadata && typeof body.metadata === "object") {
      patch.metadata = {
        ...((bookingRow.metadata && typeof bookingRow.metadata === "object") ? (bookingRow.metadata as Record<string, unknown>) : {}),
        ...(body.metadata as Record<string, unknown>),
      };
    }

    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .update(patch)
      .eq("id", bookingId)
      .select("id, reserve_venue_id, guest_name, booking_date, booking_time, party_size, status, internal_notes, metadata")
      .single();
    if (error) throw new Error(error.message);

    const venue = unwrapVenue(reserveVenue);
    await createReserveWorkItem({
      title: `Reserve booking updated · ${venue?.name || "Venue"}`,
      description: `${bookingRow.guest_name} moved to ${statusValue} for ${bookingRow.booking_date} ${bookingRow.booking_time}.`,
      priority: statusValue === "no_show" ? "high" : "medium",
      payload: {
        source: "reserve_booking_update",
        reserveVenueId: reserveVenue.id,
        venueId: reserveVenue.venue_id,
        bookingId,
        previousStatus: bookingRow.status,
        status: statusValue,
      },
    });
    await syncReservePerformance(venue?.owner_user_id);

    return NextResponse.json({ ok: true, booking: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Reserve booking." }, { status: 500 });
  }
}
