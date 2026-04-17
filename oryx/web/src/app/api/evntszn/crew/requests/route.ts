import { NextResponse } from "next/server";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) return NextResponse.json({ requests: [] });

    const { data, error } = await supabaseAdmin
      .from("evntszn_crew_booking_requests")
      .select("*")
      .eq("crew_profile_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return NextResponse.json({ requests: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load booking requests." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      crewProfileId?: string;
      requestedByName?: string;
      requestedByEmail?: string;
      requestedByPhone?: string;
      requestedRole?: string;
      eventName?: string;
      eventDate?: string;
      city?: string;
      state?: string;
      eventType?: string;
      category?: string;
      duration?: string;
      equipmentNotes?: string;
      audienceSize?: string;
      specialRequirements?: string;
      message?: string;
      budgetAmountUsd?: number | null;
      bookingFeeAccepted?: boolean;
    };

    const crewProfileId = String(body.crewProfileId || "").trim();
    const requestedByName = String(body.requestedByName || "").trim();
    const requestedByEmail = String(body.requestedByEmail || "").trim().toLowerCase();

    if (!crewProfileId || !requestedByName || !requestedByEmail) {
      return NextResponse.json({ error: "Name, email, and crew profile are required." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("id, booking_fee_usd, accepts_booking_requests, status")
      .eq("id", crewProfileId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile || profile.status !== "published" || !profile.accepts_booking_requests) {
      return NextResponse.json({ error: "This crew profile is not accepting requests." }, { status: 404 });
    }
    if (!body.bookingFeeAccepted) {
      return NextResponse.json({ error: "Booking-fee acknowledgment is required before submitting a request." }, { status: 400 });
    }

    const user = await getUser();
    const resolvedBookingFeeUsd =
      profile.booking_fee_usd && Number(profile.booking_fee_usd) > 0
        ? Number(profile.booking_fee_usd)
        : body.budgetAmountUsd && Number(body.budgetAmountUsd) > 0
          ? Number((Number(body.budgetAmountUsd) / 1000).toFixed(2))
          : null;

    const { data: requestRow, error } = await supabaseAdmin.from("evntszn_crew_booking_requests").insert({
      crew_profile_id: profile.id,
      requester_user_id: user?.id || null,
      requested_by_name: requestedByName,
      requested_by_email: requestedByEmail,
      requested_by_phone: String(body.requestedByPhone || "").trim() || null,
      requested_role: String(body.requestedRole || "").trim() || null,
      event_name: String(body.eventName || "").trim() || null,
      event_date: body.eventDate ? new Date(body.eventDate).toISOString() : null,
      city: String(body.city || "").trim() || null,
      state: String(body.state || "").trim() || null,
      message: String(body.message || "").trim() || null,
      budget_amount_usd: body.budgetAmountUsd ? Number(body.budgetAmountUsd) : null,
      flat_booking_fee_usd: resolvedBookingFeeUsd,
      status: "requested",
      metadata: {
        eventType: String(body.eventType || "").trim() || null,
        category: String(body.category || "").trim() || null,
        duration: String(body.duration || "").trim() || null,
        equipmentNotes: String(body.equipmentNotes || "").trim() || null,
        audienceSize: String(body.audienceSize || "").trim() || null,
        specialRequirements: String(body.specialRequirements || "").trim() || null,
        bookingFeeAccepted: true,
        bookingFeeRule: profile.booking_fee_usd ? "flat_fee" : "ten_percent_marketplace_fee",
        userAgent: request.headers.get("user-agent"),
      },
    }).select("id").single();
    if (error || !requestRow) throw new Error(error?.message || "Could not create booking request.");

    await createInternalWorkItem({
      deskSlug: INTERNAL_DESK_SLUGS.crew,
      title: `Crew booking · ${String(body.eventName || "").trim() || requestedByName}`,
      description: `Crew booking request for ${requestedByName}.`,
      priority: "high",
      payload: {
        bookingRequestId: requestRow.id,
        source: "crew_marketplace",
        crewProfileId: profile.id,
        requesterEmail: requestedByEmail,
        eventName: String(body.eventName || "").trim() || null,
        city: String(body.city || "").trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit booking request." },
      { status: 500 },
    );
  }
}
