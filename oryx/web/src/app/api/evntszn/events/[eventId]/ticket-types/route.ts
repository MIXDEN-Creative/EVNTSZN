import { NextResponse } from "next/server";
import { canManageEventWithViewer, requirePlatformUser } from "@/lib/evntszn";
import { getTicketAvailabilityState } from "@/lib/ticketing";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

async function requireManageableEvent(eventId: string) {
  const viewer = await requirePlatformUser("/organizer");
  const { data: event, error } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, organizer_user_id, city, state, event_class, event_vertical")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return { error: NextResponse.json({ error: "Event not found." }, { status: 404 }) };
  }

  if (!canManageEventWithViewer(viewer, event)) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { viewer, event };
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { eventId } = await params;
  const access = await requireManageableEvent(eventId);
  if ("error" in access) return access.error;

  const { data, error } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ticketTypes: (data || []).map((ticket) => ({
      ...ticket,
      availability_state: getTicketAvailabilityState(ticket),
    })),
  });
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { eventId } = await params;
  const access = await requireManageableEvent(eventId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Ticket name is required." }, { status: 400 });
  }

  const payload = {
    event_id: eventId,
    name,
    description: String(body.description || "").trim() || null,
    price_cents: Number(body.priceCents || 0),
    quantity_total: Math.max(0, Number(body.quantityTotal || 0)),
    max_per_order: Math.max(1, Number(body.maxPerOrder || 1)),
    sales_start_at: body.salesStartAt || null,
    sales_end_at: body.salesEndAt || null,
    is_active: Boolean(body.isActive ?? true),
    visibility_mode: body.visibilityMode === "hidden" ? "hidden" : "visible",
    sort_order: Number(body.sortOrder || 100),
  };

  const { data, error } = await supabaseAdmin.from("evntszn_ticket_types").insert(payload).select("*").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create ticket type." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ticketType: {
      ...data,
      availability_state: getTicketAvailabilityState(data),
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { eventId } = await params;
  const access = await requireManageableEvent(eventId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const ticketTypeId = String(body.ticketTypeId || "").trim();
  if (!ticketTypeId) {
    return NextResponse.json({ error: "Ticket type id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name || "").trim() || null;
  if (body.description !== undefined) patch.description = String(body.description || "").trim() || null;
  if (body.priceCents !== undefined) patch.price_cents = Math.max(0, Number(body.priceCents || 0));
  if (body.quantityTotal !== undefined) patch.quantity_total = Math.max(0, Number(body.quantityTotal || 0));
  if (body.maxPerOrder !== undefined) patch.max_per_order = Math.max(1, Number(body.maxPerOrder || 1));
  if (body.salesStartAt !== undefined) patch.sales_start_at = body.salesStartAt || null;
  if (body.salesEndAt !== undefined) patch.sales_end_at = body.salesEndAt || null;
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);
  if (body.visibilityMode !== undefined) patch.visibility_mode = body.visibilityMode === "hidden" ? "hidden" : "visible";
  if (body.sortOrder !== undefined) patch.sort_order = Number(body.sortOrder || 100);

  const { data, error } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .update(patch)
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not update ticket type." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ticketType: {
      ...data,
      availability_state: getTicketAvailabilityState(data),
    },
  });
}
