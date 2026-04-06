import { NextResponse } from "next/server";
import { getEventAccessForUser, logEventActivity, requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/account");
  const { eventId } = await params;
  const body = await request.json().catch(() => ({}));

  const [{ data: event }, { data: ticket }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, slug, organizer_user_id, check_in_count")
      .eq("id", eventId)
      .single(),
    supabaseAdmin
      .from("evntszn_tickets")
      .select("id, status, ticket_code, attendee_name")
      .eq("id", body.ticketId)
      .eq("event_id", eventId)
      .single(),
  ]);

  if (!event || !ticket) {
    return NextResponse.json({ error: "Ticket or event not found." }, { status: 404 });
  }

  const accessRows = await getEventAccessForUser(viewer.user!.id, event.slug);
  const hasAccess =
    viewer.isPlatformAdmin ||
    event.organizer_user_id === viewer.user!.id ||
    accessRows.some((row) => row.can_scan || row.can_manage_event || row.role_code === "venue_manager");

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (ticket.status === "checked_in") {
    return NextResponse.json({ error: "Ticket is already checked in." }, { status: 409 });
  }

  const checkedInAt = new Date().toISOString();

  await supabaseAdmin
    .from("evntszn_tickets")
    .update({
      status: "checked_in",
      checked_in_at: checkedInAt,
      checked_in_by: viewer.user!.id,
    })
    .eq("id", ticket.id);

  await supabaseAdmin
    .from("evntszn_events")
    .update({ check_in_count: (event.check_in_count || 0) + 1, scanner_status: "live" })
    .eq("id", event.id);

  await logEventActivity(event.id, viewer.user!.id, "ticket_checked_in", "Ticket checked in", {
    ticketId: ticket.id,
    ticketCode: ticket.ticket_code,
    attendeeName: ticket.attendee_name,
  });

  return NextResponse.json({ ok: true, checkedInAt });
}
