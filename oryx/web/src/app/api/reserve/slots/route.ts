import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReserveWorkItem, getBookingDayOfWeek, getReserveVenueBySlug, getReserveVenueForOwner, syncReservePerformance, unwrapVenue } from "@/lib/reserve";
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
    const reserveVenueId = request.nextUrl.searchParams.get("reserveVenueId")?.trim();
    const venueSlug = request.nextUrl.searchParams.get("venueSlug")?.trim();
    const bookingDate = request.nextUrl.searchParams.get("date")?.trim();

    let targetId = reserveVenueId || "";
    if (!targetId && venueSlug) {
      const reserveVenue = await getReserveVenueBySlug(venueSlug);
      if (!reserveVenue) return NextResponse.json({ error: "Reserve venue not found." }, { status: 404 });
      targetId = reserveVenue.id;
    }
    if (!targetId) return NextResponse.json({ error: "Reserve venue id or venue slug is required." }, { status: 400 });

    let query = supabaseAdmin
      .from("evntszn_reserve_slots")
      .select("id, reserve_venue_id, day_of_week, start_time, end_time, capacity_limit, is_active")
      .eq("reserve_venue_id", targetId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (bookingDate) {
      const dayOfWeek = getBookingDayOfWeek(bookingDate);
      if (dayOfWeek === null) return NextResponse.json({ error: "Invalid booking date." }, { status: 400 });
      query = query.eq("day_of_week", dayOfWeek);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ slots: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Reserve slots." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const reserveVenueId = String(body.reserveVenueId || "").trim();
    const slotInputs = Array.isArray(body.slots) ? body.slots : [body];
    if (!reserveVenueId) return NextResponse.json({ error: "Reserve venue id is required." }, { status: 400 });

    const reserveVenue = await getReserveVenueForOwner(user.id, reserveVenueId);
    if (!reserveVenue) return NextResponse.json({ error: "Reserve venue not found for this user." }, { status: 404 });

    const payload = slotInputs.flatMap((slot) => {
      const rawDays = Array.isArray((slot as Record<string, unknown>).daysOfWeek)
        ? ((slot as Record<string, unknown>).daysOfWeek as unknown[])
        : [(slot as Record<string, unknown>).dayOfWeek];
      return rawDays
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .map((day) => ({
          id: (slot as Record<string, unknown>).id ? String((slot as Record<string, unknown>).id) : undefined,
          reserve_venue_id: reserveVenueId,
          day_of_week: day,
          start_time: String((slot as Record<string, unknown>).startTime || "").trim(),
          end_time: String((slot as Record<string, unknown>).endTime || "").trim(),
          capacity_limit: Math.max(1, Number((slot as Record<string, unknown>).capacityLimit || 1)),
          is_active: (slot as Record<string, unknown>).isActive !== false,
        }))
        .filter((slot) => slot.start_time && slot.end_time && slot.start_time < slot.end_time);
    });

    if (!payload.length) return NextResponse.json({ error: "Valid slot inputs are required." }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_slots")
      .upsert(payload, { onConflict: "id" })
      .select("id, reserve_venue_id, day_of_week, start_time, end_time, capacity_limit, is_active");
    if (error) throw new Error(error.message);

    const venue = unwrapVenue(reserveVenue);
    await createReserveWorkItem({
      title: `Reserve slots updated · ${venue?.name || "Venue"}`,
      description: `${payload.length} slot block${payload.length === 1 ? "" : "s"} updated for Reserve operations.`,
      priority: "medium",
      payload: {
        source: "reserve_slot_update",
        reserveVenueId,
        venueId: reserveVenue.venue_id,
      },
    }).catch(() => null);
    await syncReservePerformance(venue?.owner_user_id).catch(() => null);

    return NextResponse.json({ ok: true, slots: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save Reserve slots." }, { status: 500 });
  }
}
