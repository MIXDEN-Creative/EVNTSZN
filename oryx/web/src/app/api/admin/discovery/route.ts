import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getDiscoveryNativeEvents } from "@/lib/discovery";
import { applyExternalDiscoveryControls } from "@/lib/external-discovery-controls";
import {
  getHomepageContent,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_EPL_PUBLIC_CONTENT,
  getEplPublicContent,
  DEFAULT_PUBLIC_MODULES,
  getPublicModulesContent,
} from "@/lib/site-content";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTicketmasterShowcase } from "@/lib/ticketmaster";

type DiscoveryContentUpdateBody = {
  kind: "content";
  key:
    | "homepage.hero"
    | "homepage.banner"
    | "homepage.discovery"
    | "homepage.taxonomy"
    | "homepage.visibility"
    | "epl.hero"
    | "epl.sections"
    | "epl.menu"
    | "public.modules";
  label?: string;
  description?: string;
  content: Record<string, unknown>;
};

type DiscoveryListingUpdateBody = {
  kind: "listing";
  eventId: string;
  sourceType: "evntszn" | "host" | "independent_organizer";
  badgeLabel?: string | null;
  featured?: boolean;
  listingPriority?: number;
  promoCollection?: string | null;
  isDiscoverable?: boolean;
};

type DiscoveryExternalUpdateBody = {
  kind: "external";
  source: "ticketmaster" | "eventbrite";
  externalEventId: string;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  startsAt?: string | null;
  status: "active" | "featured" | "deprioritized" | "hidden" | "unsuitable";
  priorityAdjustment?: number;
  overrideTitle?: string | null;
  overrideSummary?: string | null;
  notes?: string | null;
};

type DiscoveryUpdateBody = DiscoveryContentUpdateBody | DiscoveryListingUpdateBody | DiscoveryExternalUpdateBody;

function isMissingDiscoveryTableError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return code === "42P01" || code === "PGRST205" || /site_content_entries|discovery_listing_controls|external_discovery_controls/i.test(message);
}

export async function GET() {
  await requireAdminPermission("catalog.manage", "/epl/admin/discovery");

  const [homepage, discoveryListings, epl, modules, moderatedExternal] = await Promise.all([
    getHomepageContent(),
    getDiscoveryNativeEvents({ limit: 50 }),
    getEplPublicContent(),
    getPublicModulesContent(),
    getTicketmasterShowcase().then((events) => applyExternalDiscoveryControls("ticketmaster", events)),
  ]);

  return NextResponse.json({
    ok: true,
    storageReady: homepage.storageReady && discoveryListings.storageReady && epl.storageReady && modules.storageReady,
    defaults: {
      homepage: DEFAULT_HOMEPAGE_CONTENT,
      epl: DEFAULT_EPL_PUBLIC_CONTENT,
      modules: DEFAULT_PUBLIC_MODULES,
    },
    content: homepage,
    epl,
    modules,
    listings: discoveryListings.events,
    externalListings: moderatedExternal,
  });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("catalog.manage", "/epl/admin/discovery");

  const body = (await request.json()) as DiscoveryUpdateBody;

  if (body.kind === "content") {
    const { error } = await supabaseAdmin.from("site_content_entries").upsert(
      {
        key: body.key,
        surface: "web",
        label: body.label || body.key,
        description: body.description || null,
        content: body.content,
        is_active: true,
      },
      { onConflict: "key" },
    );

    if (error) {
      if (isMissingDiscoveryTableError(error)) {
        return NextResponse.json(
          { error: "Discovery content controls are not available until the discovery controls migration is applied." },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.kind === "listing") {
    const { error } = await supabaseAdmin.from("discovery_listing_controls").upsert(
      {
        event_id: body.eventId,
        source_type: body.sourceType,
        badge_label: body.badgeLabel || null,
        featured: Boolean(body.featured),
        listing_priority: Number(body.listingPriority || 0),
        promo_collection: body.promoCollection || null,
        is_discoverable: body.isDiscoverable !== false,
      },
      { onConflict: "event_id" },
    );

    if (error) {
      if (isMissingDiscoveryTableError(error)) {
        return NextResponse.json(
          { error: "Discovery listing controls are not available until the discovery controls migration is applied." },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.kind === "external") {
    const { error } = await supabaseAdmin.from("external_discovery_controls").upsert(
      {
        source: body.source,
        external_event_id: body.externalEventId,
        title: body.title || null,
        city: body.city || null,
        state: body.state || null,
        starts_at: body.startsAt || null,
        status: body.status,
        priority_adjustment: Number(body.priorityAdjustment || 0),
        override_title: body.overrideTitle || null,
        override_summary: body.overrideSummary || null,
        notes: body.notes || null,
        updated_by_user_id: user.id.startsWith("founder:") ? null : user.id,
      },
      { onConflict: "source,external_event_id" },
    );

    if (error) {
      if (isMissingDiscoveryTableError(error)) {
        return NextResponse.json(
          { error: "External moderation controls are not available until the external discovery controls migration is applied." },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid discovery update request." }, { status: 400 });
}
