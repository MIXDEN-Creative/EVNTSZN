import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/organizer");
  const { eventId } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: event, error: eventError } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, organizer_user_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!viewer.isPlatformAdmin && event.organizer_user_id !== viewer.user!.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const patch: Record<string, unknown> = {};

  if (body.status) patch.status = body.status;
  if (body.visibility) patch.visibility = body.visibility;
  if (body.scannerStatus) patch.scanner_status = body.scannerStatus;
  if (body.heroNote !== undefined) patch.hero_note = body.heroNote || null;
  if (body.title !== undefined) patch.title = String(body.title || "").trim() || null;
  if (body.subtitle !== undefined) patch.subtitle = String(body.subtitle || "").trim() || null;
  if (body.description !== undefined) patch.description = String(body.description || "").trim() || null;
  if (body.city !== undefined) patch.city = String(body.city || "").trim() || null;
  if (body.state !== undefined) patch.state = String(body.state || "").trim() || null;
  if (body.startAt !== undefined) patch.start_at = body.startAt || null;
  if (body.endAt !== undefined) patch.end_at = body.endAt || null;
  if (body.capacity !== undefined) patch.capacity = body.capacity ? Number(body.capacity) : null;
  if (body.bannerImageUrl !== undefined) patch.banner_image_url = String(body.bannerImageUrl || "").trim() || null;
  if (body.payoutAccountLabel !== undefined) patch.payout_account_label = String(body.payoutAccountLabel || "").trim() || null;
  if (body.eventCollection !== undefined) patch.event_collection = String(body.eventCollection || "").trim() || null;
  if (body.homeSideLabel !== undefined) patch.home_side_label = String(body.homeSideLabel || "").trim() || null;
  if (body.awaySideLabel !== undefined) patch.away_side_label = String(body.awaySideLabel || "").trim() || null;

  const { error } = await supabaseAdmin.from("evntszn_events").update(patch).eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
