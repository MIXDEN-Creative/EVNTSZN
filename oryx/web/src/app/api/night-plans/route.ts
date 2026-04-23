import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { createClient } from "@/lib/supabase/server";
import { trackEngagementEvent } from "@/lib/engagement";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ signedIn: false, plans: [] });

    const { data, error } = await supabaseAdmin
      .from("evntszn_night_plans")
      .select("id, city, title, vibe_lane, start_stop, mid_stop, peak_stop, late_stop, status, metadata, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(12);
    if (error) throw error;

    return NextResponse.json({ signedIn: true, plans: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load night plans." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      city?: string;
      vibeLane?: string;
      startStop?: string;
      midStop?: string;
      peakStop?: string;
      lateStop?: string;
    };

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Plan title is required." }, { status: 400 });
    }

    const payload = {
      user_id: userId,
      city: String(body.city || "").trim() || null,
      title,
      vibe_lane: String(body.vibeLane || "").trim() || null,
      start_stop: String(body.startStop || "").trim() || null,
      mid_stop: String(body.midStop || "").trim() || null,
      peak_stop: String(body.peakStop || "").trim() || null,
      late_stop: String(body.lateStop || "").trim() || null,
      status: "draft",
      metadata: {
        phase: "night_builder",
      },
    };

    const { data, error } = await supabaseAdmin
      .from("evntszn_night_plans")
      .insert(payload)
      .select("id, city, title, vibe_lane, start_stop, mid_stop, peak_stop, late_stop, status, metadata, created_at, updated_at")
      .single();
    if (error) throw error;

    await trackEngagementEvent({
      userId,
      eventType: "night_plan_created",
      city: payload.city,
      referenceType: "night_plan",
      referenceId: data.id,
      dedupeKey: `night-plan:${data.id}`,
      metadata: {
        vibeLane: payload.vibe_lane,
        title,
        ...buildActivitySourceMetadata({
          sourceType: "evntszn_native",
          referenceType: "night_plan",
          entityType: "night_plan",
          metadata: { vibeLane: payload.vibe_lane },
        }),
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, plan: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save night plan." },
      { status: 500 },
    );
  }
}
