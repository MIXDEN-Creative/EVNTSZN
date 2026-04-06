import { NextResponse } from "next/server";
import { ensurePlatformProfile, logEventActivity, requirePlatformUser } from "@/lib/evntszn";
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
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
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

  if (!title || !startAt || !endAt || !city || !state || !venueName) {
    return NextResponse.json({ error: "Missing required event fields." }, { status: 400 });
  }

  const profile = await ensurePlatformProfile(viewer.user!.id, {
    fullName:
      viewer.user?.user_metadata?.full_name ||
      viewer.user?.email ||
      null,
    primaryRole: viewer.isPlatformAdmin ? "admin" : "organizer",
    city,
    state,
  });

  const eventSlug = slugify(body.slug || title);
  const venueSlug = slugify(`${venueName}-${city}-${state}`);

  const { data: venue, error: venueError } = await supabaseAdmin
    .from("evntszn_venues")
    .upsert(
      {
        slug: venueSlug,
        owner_user_id: profile.primary_role === "venue" ? viewer.user!.id : null,
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
      organizer_user_id: viewer.user!.id,
      venue_id: venue.id,
      title,
      slug: eventSlug,
      subtitle: body.subtitle || null,
      description: body.description || null,
      hero_note: body.heroNote || null,
      status: body.publishNow ? "published" : "draft",
      visibility: body.publishNow ? "published" : "private_preview",
      start_at: startAt,
      end_at: endAt,
      city,
      state,
      capacity: body.capacity ? Number(body.capacity) : null,
      payout_account_label: body.payoutAccountLabel || "ORYX Event Ops",
      scanner_status: "ready",
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

  await supabaseAdmin.from("evntszn_event_staff").upsert(
    {
      event_id: event.id,
      user_id: viewer.user!.id,
      role_code: viewer.isPlatformAdmin ? "admin" : "organizer",
      can_manage_event: true,
      can_scan: true,
      can_manage_tickets: true,
      can_view_finance: true,
      status: "active",
    },
    { onConflict: "event_id,user_id,role_code" }
  );

  await logEventActivity(event.id, viewer.user!.id, "event_created", "Organizer created event", {
    slug: event.slug,
    publishNow: Boolean(body.publishNow),
  });

  return NextResponse.json({ ok: true, event });
}
