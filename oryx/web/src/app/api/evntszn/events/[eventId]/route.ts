import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/organizer");
  const { eventId } = await params;
  const body = await request.json().catch(() => ({}));

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

  const { error } = await supabaseAdmin.from("evntszn_events").update(patch).eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
