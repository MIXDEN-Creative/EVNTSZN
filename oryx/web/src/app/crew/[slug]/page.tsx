import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { supabaseAdmin } from "@/lib/supabase-admin";
import BookingRequestForm from "./BookingRequestForm";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function CrewProfilePage(context: RouteContext) {
  const { slug } = await context.params;
  const { data: profile, error } = await supabaseAdmin
    .from("evntszn_crew_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const requestsRes = await supabaseAdmin
    .from("evntszn_crew_booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("crew_profile_id", profile.id);
  const requestCount = requestsRes.count || 0;
  const isRecentlyActive = new Date(profile.updated_at).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 10;
  const workedEventIds = Array.isArray(profile.metadata?.workedEventIds)
    ? profile.metadata.workedEventIds.map((value: unknown) => String(value))
    : [];
  const { data: workedEvents } = workedEventIds.length
    ? await supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, city, state, start_at")
        .in("id", workedEventIds)
        .eq("visibility", "published")
        .eq("status", "published")
    : { data: [] as any[] };
  const creditedEvents = workedEventIds
    .map((id: string) => (workedEvents || []).find((event: any) => event.id === id))
    .filter(Boolean);

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.24),transparent_36%),linear-gradient(180deg,#0b0a12_0%,#060608_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:gap-8">
            <div className="rounded-[36px] border border-white/10 bg-black/35 p-6 md:p-8 lg:p-10">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                {profile.custom_category || profile.category}
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
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Availability</div>
                  <div className="mt-2 text-lg font-bold capitalize text-white">{profile.availability_state}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Market</div>
                  <div className="mt-2 text-lg font-bold text-white">{[profile.city, profile.state].filter(Boolean).join(", ") || "Flexible"}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Rate</div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {profile.rate_amount_cents ? `$${(profile.rate_amount_cents / 100).toFixed(0)} / ${profile.rate_unit || "event"}` : "Quote on request"}
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
                    {creditedEvents.map((event: any) => (
                      <a key={event.id} href={`/events/${event.slug}`} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
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

            <BookingRequestForm crewProfileId={profile.id} crewName={profile.display_name} />
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
