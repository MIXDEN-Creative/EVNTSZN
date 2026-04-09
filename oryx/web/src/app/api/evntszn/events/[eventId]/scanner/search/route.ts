import { NextResponse } from "next/server";
import { getEventAccessForUser, requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/account");
  const { eventId } = await params;
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const { data: event } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, slug, organizer_user_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const accessRows = await getEventAccessForUser(viewer.user!.id, event.slug);
  const hasAccess =
    viewer.isPlatformAdmin ||
    event.organizer_user_id === viewer.user!.id ||
    accessRows.some((row) => row.can_scan || row.can_manage_event || row.role_code === "venue_manager");

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("evntszn_tickets")
    .select("id, attendee_name, attendee_email, ticket_code, status, checked_in_at, evntszn_ticket_types(name)")
    .eq("event_id", eventId)
    .or(`ticket_code.ilike.%${query}%,attendee_name.ilike.%${query}%,attendee_email.ilike.%${query}%`)
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: (data || []).map((ticket: any) => ({
      ...ticket,
      ticket_type_name: Array.isArray(ticket.evntszn_ticket_types)
        ? ticket.evntszn_ticket_types[0]?.name || null
        : ticket.evntszn_ticket_types?.name || null,
    })),
  });
}
