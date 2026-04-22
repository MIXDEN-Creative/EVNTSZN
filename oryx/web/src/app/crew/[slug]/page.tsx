import Link from "next/link";
import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { isSupabaseCredentialError } from "@/lib/runtime-env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import { CREW_CATEGORIES, getCrewCategoryLabel } from "@/lib/platform-products";
import BookingRequestForm from "./BookingRequestForm";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type WorkedEvent = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  state: string | null;
  start_at: string;
};

export const dynamic = "force-dynamic";

function firstErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default async function CrewProfilePage(context: RouteContext) {
  const { slug } = await context.params;
  const matchedCategory = CREW_CATEGORIES.includes(slug as (typeof CREW_CATEGORIES)[number]) ? slug : null;

  if (matchedCategory && matchedCategory !== "custom") {
    const runCategoryQuery = async (client: typeof supabaseAdmin) =>
      client
        .from("evntszn_crew_profiles")
        .select("id, slug, display_name, headline, city, state, availability_state, rate_unit, custom_category")
        .eq("status", "published")
        .eq("category", matchedCategory)
        .order("updated_at", { ascending: false });

    let { data: profiles, error: categoryError } = await runCategoryQuery(supabaseAdmin);
    if (categoryError && isSupabaseCredentialError(categoryError)) {
      const fallback = await runCategoryQuery(supabasePublicServer);
      profiles = fallback.data;
      categoryError = fallback.error;
    }

    if (categoryError) {
      throw new Error(firstErrorMessage(categoryError));
    }

    return (
      <PublicPageFrame
        title={`${getCrewCategoryLabel(matchedCategory)}s on EVNTSZN Crew`}
        description={`Browse live ${getCrewCategoryLabel(matchedCategory).toLowerCase()} listings and send a booking request without leaving the marketplace.`}
      >
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">Crew category</div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{getCrewCategoryLabel(matchedCategory)}</h1>
            </div>
            <Link href={`/crew?category=${matchedCategory}`} className="ev-button-secondary">
              Open full marketplace
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(profiles || []).map((profile) => (
              <Link key={profile.id} href={`/crew/${profile.slug}`} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                      {profile.custom_category || getCrewCategoryLabel(matchedCategory)}
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight text-white">{profile.display_name}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                    {profile.availability_state}
                  </div>
                </div>
                {profile.headline ? <p className="mt-4 text-sm leading-6 text-white/68">{profile.headline}</p> : null}
                <div className="mt-4 text-sm text-white/52">{[profile.city, profile.state].filter(Boolean).join(", ") || "Location flexible"}</div>
                <div className="mt-4 text-sm font-semibold text-emerald-100">Quote on request</div>
              </Link>
            ))}
            {!profiles?.length ? (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-white/58 md:col-span-2 xl:col-span-3">
                No live {getCrewCategoryLabel(matchedCategory).toLowerCase()} profiles are published yet.
              </div>
            ) : null}
          </div>
        </section>
      </PublicPageFrame>
    );
  }

  const runProfileQuery = async (client: typeof supabaseAdmin) =>
    client
      .from("evntszn_crew_profiles")
      .select("id, slug, display_name, category, custom_category, headline, short_bio, city, state, availability_state, rate_unit, portfolio_links, website_url, instagram_url, tags, metadata, updated_at, created_at, booking_fee_usd")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

  let { data: profile, error } = await runProfileQuery(supabaseAdmin);
  if (error && isSupabaseCredentialError(error)) {
    const fallback = await runProfileQuery(supabasePublicServer);
    profile = fallback.data;
    error = fallback.error;
  }

  if (error || !profile) {
    notFound();
  }

  let requestsRes: { count?: number | null } = { count: 0 };
  try {
    requestsRes = await supabaseAdmin
      .from("evntszn_crew_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("crew_profile_id", profile.id);
  } catch {
    requestsRes = { count: 0 };
  }
  const requestCount = requestsRes.count || 0;
  const isRecentlyActive = new Date(profile.updated_at).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 10;
  const workedEventIds = Array.isArray(profile.metadata?.workedEventIds)
    ? profile.metadata.workedEventIds.map((value: unknown) => String(value))
    : [];
  let workedEvents: WorkedEvent[] = [];
  if (workedEventIds.length) {
    try {
      const response = await supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, city, state, start_at")
        .in("id", workedEventIds)
        .eq("visibility", "published")
        .eq("status", "published");
      workedEvents = (response.data || []) as WorkedEvent[];
    } catch {
      workedEvents = [];
    }
  }
  const creditedEvents = workedEventIds
    .map((id: string) => workedEvents.find((event: WorkedEvent) => event.id === id))
    .filter(Boolean);

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.24),transparent_36%),linear-gradient(180deg,#0b0a12_0%,#060608_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:gap-8">
            <div className="ev-section-frame">
              <div className="ev-dashboard-hero">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                {profile.custom_category || getCrewCategoryLabel(profile.category)}
              </div>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl xl:text-7xl">{profile.display_name}</h1>
              {profile.headline ? <p className="mt-4 max-w-3xl text-lg leading-8 text-white/76">{profile.headline}</p> : null}
              {profile.short_bio ? <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">{profile.short_bio}</p> : null}

              <div className="mt-7 flex flex-wrap gap-3">
                {profile.availability_state === "available" ? (
                  <div className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                    Available now
                  </div>
                ) : null}
                {isRecentlyActive ? (
                  <div className="rounded-full border border-[#A259FF]/25 bg-[#A259FF]/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#eadcff]">
                    Recently active
                  </div>
                ) : null}
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72">
                  {requestCount} requests sent
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="ev-feature-card">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Availability</div>
                  <div className="mt-2 text-lg font-bold capitalize text-white">{profile.availability_state}</div>
                </div>
                <div className="ev-feature-card">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Market</div>
                  <div className="mt-2 text-lg font-bold text-white">{[profile.city, profile.state].filter(Boolean).join(", ") || "Flexible"}</div>
                </div>
                <div className="ev-feature-card">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Rate</div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {profile.booking_fee_usd && profile.booking_fee_usd > 0 ? `$${Number(profile.booking_fee_usd).toFixed(2)} platform fee + provider quote` : "Provider quote + 10% EVNTSZN booking fee"}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {Array.isArray(profile.portfolio_links) ? profile.portfolio_links.map((link: string) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                    Portfolio
                  </a>
                )) : null}
                {profile.website_url ? (
                  <a href={profile.website_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                    Website
                  </a>
                ) : null}
                {profile.instagram_url ? (
                  <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                    Instagram
                  </a>
                ) : null}
              </div>

              {Array.isArray(profile.tags) && profile.tags.length ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {profile.tags.map((tag: string) => (
                    <span key={tag} className="ev-chip ev-chip--external">{tag}</span>
                  ))}
                </div>
              ) : null}

              {creditedEvents.length ? (
                <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Worked events</div>
                  <div className="mt-4 grid gap-3">
                    {creditedEvents.map((event: WorkedEvent) => (
                      <a key={event.id} href={`/events/${event.slug}`} className="ev-list-card transition hover:bg-white/[0.06]">
                        <div className="text-base font-bold text-white">{event.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {[event.city, event.state].filter(Boolean).join(", ")} • {new Date(event.start_at).toLocaleDateString()}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              </div>
            </div>

            <BookingRequestForm crewProfileId={profile.id} crewName={profile.display_name} bookingFeeUsd={profile.booking_fee_usd} />
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
