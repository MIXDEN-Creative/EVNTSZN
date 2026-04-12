import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CREW_BOOKING_STATUSES } from "@/lib/platform-products";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      internalNotes?: string;
    };

    const status = String(body.status || "").trim();
    if (!CREW_BOOKING_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: "Invalid booking status." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) return NextResponse.json({ error: "Crew profile not found." }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("evntszn_crew_booking_requests")
      .update({
        status,
        internal_notes: String(body.internalNotes || "").trim() || null,
        responded_at: new Date().toISOString(),
        responded_by_user_id: user.id,
      })
      .eq("id", requestId)
      .eq("crew_profile_id", profile.id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    return NextResponse.json({ request: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update booking request." },
      { status: 500 },
    );
  }
}
