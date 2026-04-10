import { NextResponse } from "next/server";
import { canManageEventWithViewer, requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/organizer");
  const { eventId } = await params;

  const { data: event, error } = await supabaseAdmin
    .from("evntszn_events")
    .select(`
      *,
      evntszn_venues(name)
    `)
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!canManageEventWithViewer(viewer, event)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [{ data: ticketTypes }, { data: operations }, { data: revenueProfile }, { data: revenueRecords }, { data: revenueLedger }, { data: revenueAudits }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_ticket_types")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_event_operations")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabaseAdmin
      .from("event_revenue_profiles")
      .select("id, event_type, city_office_id, is_independent, independent_origin")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabaseAdmin
      .from("ticket_revenue_records")
      .select("gross_amount, platform_fee_amount, net_amount")
      .eq("event_id", eventId),
    supabaseAdmin
      .from("revenue_ledger")
      .select("recipient_type, amount, status, source_type")
      .eq("event_id", eventId),
    supabaseAdmin
      .from("revenue_audit_runs")
      .select("is_balanced, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const grossTicketRevenue = (revenueRecords || []).reduce((sum: number, row: any) => sum + Number(row.gross_amount || 0), 0);
  const platformFeeTotal = (revenueRecords || []).reduce((sum: number, row: any) => sum + Number(row.platform_fee_amount || 0), 0);
  const netRevenueTotal = (revenueRecords || []).reduce((sum: number, row: any) => sum + Number(row.net_amount || 0), 0);
  const hostShare = (revenueLedger || [])
    .filter((row: any) => row.recipient_type === "host")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const cityLeaderShare = (revenueLedger || [])
    .filter((row: any) => row.recipient_type === "city_leader")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const cityOfficeShare = (revenueLedger || [])
    .filter((row: any) => row.recipient_type === "city_office")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const hqShare = (revenueLedger || [])
    .filter((row: any) => row.recipient_type === "hq")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const overrideTotal = (revenueLedger || [])
    .filter((row: any) => row.source_type === "override")
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const ledgerStatuses = (revenueLedger || []).reduce(
    (summary: Record<string, number>, row: any) => {
      const key = String(row.status || "pending");
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    },
    { pending: 0, locked: 0, void: 0 },
  );
  const latestAudit = revenueAudits?.[0] || null;

  return NextResponse.json({
    ok: true,
    event: {
      ...event,
      venue_name: Array.isArray(event.evntszn_venues)
        ? event.evntszn_venues[0]?.name || null
        : event.evntszn_venues?.name || null,
    },
    ticketTypes: ticketTypes || [],
    operations: operations || null,
    revenue: {
      profile: revenueProfile || null,
      totals: {
        grossTicketRevenue,
        platformFeeTotal,
        netRevenueTotal,
        hostShare,
        cityLeaderShare,
        cityOfficeShare,
        hqShare,
        overrideTotal,
      },
      auditStatus: latestAudit ? (latestAudit.is_balanced ? "balanced" : "unbalanced") : "pending",
      ledgerStatuses,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/organizer");
  const { eventId } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: event, error: eventError } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, organizer_user_id, city, state, event_class, event_vertical")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!canManageEventWithViewer(viewer, event)) {
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
  if (body.mmlMetadata !== undefined) patch.mml_metadata = body.mmlMetadata;

  if (Object.keys(patch).length) {
    const { error } = await supabaseAdmin.from("evntszn_events").update(patch).eq("id", eventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.operations && typeof body.operations === "object") {
    const operations = body.operations as Record<string, unknown>;
    const { error: opsError } = await supabaseAdmin.from("evntszn_event_operations").upsert(
      {
        event_id: eventId,
        objective: String(operations.objective || "").trim() || null,
        run_of_show: String(operations.runOfShow || "").trim() || null,
        ops_notes: String(operations.opsNotes || "").trim() || null,
        updated_by_user_id: viewer.user?.id.startsWith("founder:") ? null : viewer.user?.id || null,
      },
      { onConflict: "event_id" },
    );

    if (opsError) {
      return NextResponse.json({ error: opsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
