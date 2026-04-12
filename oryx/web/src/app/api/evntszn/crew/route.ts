import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CREW_AVAILABILITY_STATES, CREW_CATEGORIES, slugify } from "@/lib/platform-products";

type CrewProfilePayload = {
  displayName?: string;
  slug?: string;
  category?: string;
  customCategory?: string;
  headline?: string;
  shortBio?: string;
  city?: string;
  state?: string;
  rateAmountCents?: number | null;
  rateUnit?: string | null;
  availabilityState?: string;
  acceptsBookingRequests?: boolean;
  bookingFeeCents?: number | null;
  portfolioLinks?: string[];
  portfolioImages?: string[];
  tags?: string[];
  instagramUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  status?: "draft" | "published";
  workedEventIds?: string[];
};

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function buildUniqueCrewSlug(baseInput: string, userId: string, currentProfileId?: string) {
  const base = slugify(baseInput) || `crew-${userId.slice(0, 8)}`;
  for (let index = 0; index < 12; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const [crewRes, linkRes] = await Promise.all([
      supabaseAdmin
        .from("evntszn_crew_profiles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle(),
      supabaseAdmin
        .from("evntszn_link_pages")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle(),
    ]);
    if (crewRes.error) throw new Error(crewRes.error.message);
    if (linkRes.error) throw new Error(linkRes.error.message);
    const crewOwnsCandidate = !crewRes.data || crewRes.data.id === currentProfileId;
    if (crewOwnsCandidate && !linkRes.data) {
      return candidate;
    }
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
    const city = request.nextUrl.searchParams.get("city")?.trim() || "";
    const category = request.nextUrl.searchParams.get("category")?.trim() || "";
    const availability = request.nextUrl.searchParams.get("availability")?.trim() || "";
    const mine = request.nextUrl.searchParams.get("mine") === "1";

    if (mine) {
      const user = await getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("evntszn_crew_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);
      let requestCount = 0;
      if (profile?.id) {
        const countRes = await supabaseAdmin
          .from("evntszn_crew_booking_requests")
          .select("id", { count: "exact", head: true })
          .eq("crew_profile_id", profile.id);
        if (!countRes.error) {
          requestCount = countRes.count || 0;
        }
      }
      const { data: availableEvents, error: eventsError } = await supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, city, state, start_at")
        .eq("visibility", "published")
        .eq("status", "published")
        .order("start_at", { ascending: false })
        .limit(20);
      if (eventsError) throw new Error(eventsError.message);
      const metadata = profile?.metadata && typeof profile.metadata === "object" ? profile.metadata : {};
      const workedEventIds = Array.isArray((metadata as { workedEventIds?: unknown }).workedEventIds)
        ? ((metadata as { workedEventIds?: unknown[] }).workedEventIds || []).map((value) => String(value))
        : [];
      return NextResponse.json({
        profile: profile ? { ...profile, request_count: requestCount, worked_event_ids: workedEventIds } : null,
        availableEvents: availableEvents || [],
      });
    }

    let query = supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("*")
      .eq("status", "published")
      .order("availability_state", { ascending: true })
      .order("updated_at", { ascending: false });

    if (city) query = query.ilike("city", `%${city}%`);
    if (category && CREW_CATEGORIES.includes(category as (typeof CREW_CATEGORIES)[number])) {
      query = query.eq("category", category);
    }
    if (availability && CREW_AVAILABILITY_STATES.includes(availability as (typeof CREW_AVAILABILITY_STATES)[number])) {
      query = query.eq("availability_state", availability);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const profiles = (data || []).filter((profile) => {
      if (!search) return true;
      return [
        profile.display_name,
        profile.category,
        profile.custom_category,
        profile.headline,
        profile.short_bio,
        profile.city,
        profile.state,
        ...(Array.isArray(profile.tags) ? profile.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    const profileIds = profiles.map((profile) => profile.id);
    const requestCounts = new Map<string, number>();

    if (profileIds.length) {
      const { data: requestsData, error: requestsError } = await supabaseAdmin
        .from("evntszn_crew_booking_requests")
        .select("crew_profile_id")
        .in("crew_profile_id", profileIds);
      if (requestsError) throw new Error(requestsError.message);

      for (const row of requestsData || []) {
        requestCounts.set(row.crew_profile_id, (requestCounts.get(row.crew_profile_id) || 0) + 1);
      }
    }

    const enrichedProfiles = profiles
      .map((profile) => ({
        ...profile,
        request_count: requestCounts.get(profile.id) || 0,
        is_recently_active: new Date(profile.updated_at).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 10,
        is_new_listing: new Date(profile.created_at).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 7,
      }))
      .sort((left, right) => {
        if (right.request_count !== left.request_count) return right.request_count - left.request_count;
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      });

    return NextResponse.json({ profiles: enrichedProfiles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load crew marketplace." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingRes = await supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingRes.error) throw new Error(existingRes.error.message);

    const body = (await request.json().catch(() => ({}))) as CrewProfilePayload;
    const displayName = String(body.displayName || existingRes.data?.display_name || user.email?.split("@")[0] || "Crew profile").trim();
    const slug = await buildUniqueCrewSlug(body.slug || displayName, user.id, existingRes.data?.id);
    const category = CREW_CATEGORIES.includes(String(body.category) as any) ? String(body.category) : "custom";

    const payload = {
      user_id: user.id,
      slug,
      display_name: displayName,
      category,
      custom_category: category === "custom" ? String(body.customCategory || "").trim() || null : null,
      headline: String(body.headline || "").trim() || null,
      short_bio: String(body.shortBio || "").trim() || null,
      city: String(body.city || "").trim() || null,
      state: String(body.state || "").trim() || null,
      rate_amount_cents: body.rateAmountCents ? Number(body.rateAmountCents) : null,
      rate_unit: String(body.rateUnit || "").trim() || null,
      availability_state: CREW_AVAILABILITY_STATES.includes(String(body.availabilityState) as any)
        ? String(body.availabilityState)
        : "available",
      accepts_booking_requests: body.acceptsBookingRequests !== false,
      booking_fee_cents: body.bookingFeeCents ? Number(body.bookingFeeCents) : null,
      portfolio_links: Array.isArray(body.portfolioLinks) ? body.portfolioLinks.filter(Boolean) : [],
      portfolio_images: Array.isArray(body.portfolioImages) ? body.portfolioImages.filter(Boolean) : [],
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
      instagram_url: String(body.instagramUrl || "").trim() || null,
      website_url: String(body.websiteUrl || "").trim() || null,
      contact_email: String(body.contactEmail || user.email || "").trim() || null,
      status: body.status === "published" ? "published" : "draft",
      metadata: {
        ...((existingRes.data?.metadata && typeof existingRes.data.metadata === "object"
          ? existingRes.data.metadata
          : {}) as Record<string, unknown>),
        workedEventIds: Array.isArray(body.workedEventIds) ? body.workedEventIds.filter(Boolean).map(String) : [],
      },
    };

    const { data, error } = await supabaseAdmin
      .from("evntszn_crew_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({
      profile: {
        ...data,
        request_count: 0,
        worked_event_ids: Array.isArray(body.workedEventIds) ? body.workedEventIds.filter(Boolean).map(String) : [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save crew profile." },
      { status: 500 },
    );
  }
}
