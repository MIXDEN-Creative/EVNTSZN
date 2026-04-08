import { NextResponse } from "next/server";
import { ensurePlatformProfile, logEventActivity, requirePlatformUser } from "@/lib/evntszn";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CreateEventBody = {
  title?: string;
  slug?: string;
  startAt?: string;
  endAt?: string;
  city?: string;
  state?: string;
  venueName?: string;
  subtitle?: string;
  description?: string;
  heroNote?: string;
  publishNow?: boolean;
  capacity?: number | string;
  payoutAccountLabel?: string;
  ticketPriceCents?: number | string;
  ticketQuantityTotal?: number | string;
  ticketTypeName?: string;
  ticketDescription?: string;
  maxPerOrder?: number | string;
  bannerImageUrl?: string;
  timezone?: string;
  eventVertical?: "evntszn" | "epl";
  eventCollection?: string;
  homeSideLabel?: string;
  awaySideLabel?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function GET(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/events");

  const { searchParams } = new URL(request.url);
  const vertical = searchParams.get("vertical");

  let query = supabaseAdmin
    .from("evntszn_events")
    .select(`
      id,
      title,
      slug,
      subtitle,
      status,
      visibility,
      city,
      state,
      start_at,
      end_at,
      banner_image_url,
      event_vertical,
      event_collection,
      home_side_label,
      away_side_label,
      payout_account_label,
      scanner_status,
      venues:evntszn_venues(name)
    `)
    .order("start_at", { ascending: false })
    .limit(60);

  if (vertical === "evntszn" || vertical === "epl") {
    query = query.eq("event_vertical", vertical);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    events: (data || []).map((event: any) => ({
      ...event,
      venue_name: event.venues?.name || null,
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await requirePlatformUser("/organizer");
  const body = (await request.json().catch(() => ({}))) as CreateEventBody;
  const title = String(body.title || "").trim();
  const startAt = String(body.startAt || "");
  const endAt = String(body.endAt || "");
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const venueName = String(body.venueName || "").trim();
  const eventVertical = body.eventVertical === "epl" ? "epl" : "evntszn";
  const eventCollection = String(body.eventCollection || "").trim() || null;
  const bannerImageUrl = String(body.bannerImageUrl || "").trim() || null;
  const timezone = String(body.timezone || "").trim() || "America/New_York";
  const homeSideLabel = String(body.homeSideLabel || "").trim() || null;
  const awaySideLabel = String(body.awaySideLabel || "").trim() || null;

  if (!title || !startAt || !endAt || !city || !state || !venueName) {
    return NextResponse.json({ error: "Missing required event fields." }, { status: 400 });
  }

  if (eventVertical === "epl" && !viewer.isPlatformAdmin) {
    return NextResponse.json({ error: "Only admins can create EPL events." }, { status: 403 });
  }

  const actingUserId = viewer.user!.id.startsWith("founder:") ? null : viewer.user!.id;
  const profile = actingUserId
    ? await ensurePlatformProfile(actingUserId, {
        fullName: viewer.user?.user_metadata?.full_name || viewer.user?.email || null,
        primaryRole: viewer.isPlatformAdmin ? "admin" : "organizer",
        city,
        state,
      })
    : null;

  const eventSlug = slugify(body.slug || title);
  const venueSlug = slugify(`${venueName}-${city}-${state}`);

  const { data: venue, error: venueError } = await supabaseAdmin
    .from("evntszn_venues")
    .upsert(
      {
        slug: venueSlug,
        owner_user_id: profile?.primary_role === "venue" ? actingUserId : null,
        name: venueName,
        city,
        state,
        contact_email: viewer.user?.email || null,
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (venueError || !venue) {
    return NextResponse.json({ error: venueError?.message || "Could not create venue." }, { status: 500 });
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("evntszn_events")
    .insert({
      organizer_user_id: actingUserId,
      venue_id: venue.id,
      title,
      slug: eventSlug,
      subtitle: body.subtitle || null,
      description: body.description || null,
      hero_note: body.heroNote || null,
      banner_image_url: bannerImageUrl,
      status: body.publishNow ? "published" : "draft",
      visibility: body.publishNow ? "published" : "private_preview",
      start_at: startAt,
      end_at: endAt,
      timezone,
      city,
      state,
      capacity: body.capacity ? Number(body.capacity) : null,
      payout_account_label: body.payoutAccountLabel || "ORYX Event Ops",
      scanner_status: "ready",
      event_vertical: eventVertical,
      event_collection: eventCollection,
      home_side_label: homeSideLabel,
      away_side_label: awaySideLabel,
    })
    .select("id, slug")
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: eventError?.message || "Could not create event." }, { status: 500 });
  }

  const priceCents = Number(body.ticketPriceCents || 0);
  const quantityTotal = Number(body.ticketQuantityTotal || 50);

  const { error: ticketTypeError } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .insert({
      event_id: event.id,
      name: body.ticketTypeName || "General Access",
      description: body.ticketDescription || "Primary ticket inventory for this event.",
      price_cents: priceCents,
      quantity_total: quantityTotal,
      max_per_order: Number(body.maxPerOrder || 4),
      is_active: true,
    });

  if (ticketTypeError) {
    return NextResponse.json({ error: ticketTypeError.message }, { status: 500 });
  }

  if (actingUserId) {
    await supabaseAdmin.from("evntszn_event_staff").upsert(
      {
        event_id: event.id,
        user_id: actingUserId,
        role_code: viewer.isPlatformAdmin ? "admin" : "organizer",
        can_manage_event: true,
        can_scan: true,
        can_manage_tickets: true,
        can_view_finance: true,
        status: "active",
      },
      { onConflict: "event_id,user_id,role_code" }
    );
  }

  await logEventActivity(event.id, actingUserId, "event_created", "Organizer created event", {
    slug: event.slug,
    publishNow: Boolean(body.publishNow),
    eventVertical,
  });

  return NextResponse.json({ ok: true, event });
}
