import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createReserveWorkItem, getReserveVenueBySlug, normalizeReserveSettings, syncReservePerformance, unwrapVenue } from "@/lib/reserve";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  const mine = request.nextUrl.searchParams.get("mine") === "1";

  try {
    if (slug) {
      const row = await getReserveVenueBySlug(slug);
      if (!row) return NextResponse.json({ error: "Reserve venue not found." }, { status: 404 });
      return NextResponse.json({
        venue: {
          id: row.id,
          venueId: row.venue_id,
          isActive: row.is_active,
          settings: normalizeReserveSettings((row.settings || {}) as Record<string, unknown>),
          venue: unwrapVenue(row),
        },
      });
    }

    if (mine) {
      const user = await getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data, error } = await supabaseAdmin
        .from("evntszn_reserve_venues")
        .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
        .eq("evntszn_venues.owner_user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);

      return NextResponse.json({
        venues: (data || []).map((row) => ({
          id: row.id,
          venueId: row.venue_id,
          isActive: row.is_active,
          settings: normalizeReserveSettings((row.settings || {}) as Record<string, unknown>),
          venue: Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] || null : row.evntszn_venues,
        })),
      });
    }

    await requireAdminPermission("admin.manage", "/epl/admin/control-center");
    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      venues: (data || []).map((row) => ({
        id: row.id,
        venueId: row.venue_id,
        isActive: row.is_active,
        settings: normalizeReserveSettings((row.settings || {}) as Record<string, unknown>),
        venue: Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] || null : row.evntszn_venues,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Reserve venues." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const venueId = String(body.venueId || "").trim();
    if (!venueId) return NextResponse.json({ error: "Venue id is required." }, { status: 400 });

    const { data: ownedVenue, error: ownedVenueError } = await supabaseAdmin
      .from("evntszn_venues")
      .select("id, slug, name, city, state, timezone, owner_user_id")
      .eq("id", venueId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (ownedVenueError) throw new Error(ownedVenueError.message);
    if (!ownedVenue) return NextResponse.json({ error: "This venue is not owned by the current user." }, { status: 403 });

    const settings = normalizeReserveSettings((body.settings as Record<string, unknown> | undefined) || {});
    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .upsert(
        {
          venue_id: venueId,
          is_active: body.isActive !== false,
          settings,
        },
        { onConflict: "venue_id" },
      )
      .select("id, venue_id, is_active, settings")
      .single();
    if (error) throw new Error(error.message);

    await createReserveWorkItem({
      title: `Reserve venue configured · ${ownedVenue.name}`,
      description: `Reserve operating settings updated for ${ownedVenue.name} in ${ownedVenue.city}, ${ownedVenue.state}.`,
      priority: "medium",
      payload: {
        source: "reserve_venue_setup",
        reserveVenueId: data.id,
        venueId: ownedVenue.id,
        venueSlug: ownedVenue.slug,
        ownerUserId: user.id,
      },
    }).catch(() => null);
    await syncReservePerformance(user.id).catch(() => null);

    return NextResponse.json({
      ok: true,
      venue: {
        id: data.id,
        venueId: data.venue_id,
        isActive: data.is_active,
        settings: normalizeReserveSettings((data.settings || {}) as Record<string, unknown>),
        venue: ownedVenue,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save Reserve venue." }, { status: 500 });
  }
}
