import { NextResponse } from "next/server";
import { buildUniqueSlug } from "@/lib/evntszn-phase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      venueId?: string;
      title?: string;
      startAt?: string;
    };

    if (!body.venueId || !body.title || !body.startAt) {
      return NextResponse.json({ error: "Venue, title, and start time are required." }, { status: 400 });
    }

    const { data: venue, error: venueError } = await supabaseAdmin
      .from("evntszn_venues")
      .select("id, name, city, state, timezone")
      .eq("id", body.venueId)
      .maybeSingle();
    if (venueError || !venue) {
      return NextResponse.json({ error: venueError?.message || "Venue not found." }, { status: 404 });
    }

    const startAt = new Date(body.startAt);
    const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);
    const { data, error } = await supabaseAdmin
      .from("evntszn_events")
      .insert({
        venue_id: venue.id,
        title: body.title,
        slug: buildUniqueSlug(body.title, crypto.randomUUID().slice(0, 5)),
        subtitle: "Posted through the venue dashboard.",
        description: "Basic venue-posted event. Event post fee logic set to $0.99.",
        status: "published",
        visibility: "published",
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        timezone: venue.timezone,
        city: venue.city,
        state: venue.state,
        notes: "event_post_fee_usd=0.99",
      })
      .select("id, slug, title, subtitle, description, city, state, start_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not post event." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      event: {
        id: data.id,
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        city: data.city,
        state: data.state,
        startAt: data.start_at,
        endAt: data.start_at,
        imageUrl: "",
        eventClass: null,
        eventVertical: null,
        venueName: venue.name,
        venueSlug: null,
        timezone: venue.timezone,
      },
      message: "Event posted with $0.99 fee logic recorded.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not post event." },
      { status: 500 },
    );
  }
}
