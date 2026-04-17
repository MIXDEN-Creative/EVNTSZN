import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ReserveIntakeForm from "@/components/public/ReserveIntakeForm";
import { getReserveVenuesByCity } from "@/lib/public-directory";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { normalizeReserveSettings } from "@/lib/reserve";
import { getReserveOrigin } from "@/lib/domains";
import { buildItemListSchema, buildPageMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase-admin";

const RESERVE_PLANS = [
  {
    title: "Venue Pro + Reserve",
    price: "$99",
    cadence: "/month + $0.30 / reservation",
    note: "Best fit for nightlife venues",
    cta: { href: "#reserve-intake", label: "Route Reserve" },
    points: ["Reserve slot control and waitlist ops", "Venue dashboard and booking oversight", "Live routing into the Reserve desk"],
  },
  {
    title: "Reserve Standalone",
    price: "$79",
    cadence: "/month + $0.50 / reservation",
    note: "For dedicated booking operations",
    cta: { href: "#reserve-intake", label: "Launch standalone" },
    points: ["Reservations, waitlist system, time slots, and capacity control", "No Smart Fill, no Pulse, and no EVNTSZN ecosystem access", "Best fit for dedicated booking businesses"],
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Reserve reservations, nightlife tables, and booking flow | EVNTSZN",
  description:
    "Search EVNTSZN Reserve for reservations, nightlife table bookings, brunch demand, and guest-flow-ready venues.",
  path: "/",
  origin: getReserveOrigin(),
  image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80",
  keywords: [
    "reservations near me",
    "nightlife reservations",
    "brunch reservations",
    "lounges near me",
    "reserve booking",
    "EVNTSZN Reserve",
  ],
});

export default async function ReservePage() {
  const liveVenuesRes = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("id, settings, evntszn_venues!inner(slug, name, city, state)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);
  const liveVenues = liveVenuesRes.error ? [] : liveVenuesRes.data || [];

  const cityLinks = await Promise.all(PUBLIC_CITIES.map((city) => getReserveVenuesByCity(city.slug, 3).then((venues) => ({ city, venues }))));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "EVNTSZN Reserve",
      description:
        "EVNTSZN Reserve is the reservation and nightlife booking layer for table flow, waitlist pressure, and guest routing.",
      brand: {
        "@type": "Brand",
        name: "EVNTSZN",
      },
      category: "Reservations Platform",
      offers: RESERVE_PLANS.map((plan) => ({
        "@type": "Offer",
        name: plan.title,
        priceCurrency: "USD",
        price: plan.price.replace(/[^0-9.]/g, ""),
        availability: "https://schema.org/InStock",
        url: `${getReserveOrigin()}/`,
      })),
    },
    buildItemListSchema({
      name: "Reserve venues on EVNTSZN",
      path: `${getReserveOrigin()}/`,
      items: (liveVenues || []).map((row) => {
        const venue = Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] : row.evntszn_venues;
        return {
          name: venue?.name || "Reserve Venue",
          url: `${getReserveOrigin()}/${venue?.slug}`,
        };
      }),
    }),
  ];

  return (
    <PublicPageFrame
      title="EVNTSZN Reserve"
      description="Dining reservations, nightlife tables, waitlist control, and guest routing for venues that need a real reservation engine."
      heroImage="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80"
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Reserve", path: "/reserve" },
      ]}
      structuredData={structuredData}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-8 md:p-10">
            <div className="ev-section-kicker">Reserve operating layer</div>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">Bookings, waitlist, and table control for nightlife.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Reserve is built for venues that need real guest flow, not a static booking link. Control reservations, nightlife tables, waitlist pressure, and desk routing from one EVNTSZN system.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Fill control</div>
                <div className="mt-3 text-sm text-white/65">Live slot limits, waitlist pressure, and guest pacing.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Revenue view</div>
                <div className="mt-3 text-sm text-white/65">Track monthly reservation volume and expected EVNTSZN Reserve revenue cleanly.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Dining ready</div>
                <div className="mt-3 text-sm text-white/65">Full dining reservation flow and pre-service guest pacing on the same stack.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Internal desk</div>
                <div className="mt-3 text-sm text-white/65">Every Reserve intake lands in the Reserve desk for assignment and approval.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Venue routing</div>
                <div className="mt-3 text-sm text-white/65">Works cleanly with venue onboarding, agreements, and discreet venue inquiry routing.</div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#reserve-plans" className="ev-button-primary px-8">View pricing</Link>
              <Link href="#reserve-intake" className="ev-button-secondary px-8">Send to Reserve desk</Link>
              <Link href="/account/reserve" className="ev-button-secondary px-8">Open Reserve dashboard</Link>
            </div>
          </div>

          <div className="grid gap-4">
            {(liveVenues || []).length ? (
              (liveVenues || []).map((row) => {
                const venue = Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] : row.evntszn_venues;
                const settings = normalizeReserveSettings((row.settings || {}) as Record<string, unknown>);
                return (
                  <Link key={row.id} href={`/reserve/${venue?.slug}`} className="rounded-[28px] border border-white/10 bg-black/30 p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
                    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Now booking</div>
                    <div className="mt-3 text-2xl font-black text-white">{venue?.name}</div>
                    <div className="mt-2 text-sm text-white/58">{venue?.city}, {venue?.state}</div>
                    <div className="mt-4 text-sm text-white/70">
                      Waitlist {settings.waitlist_enabled === false ? "off" : "on"} · max party {settings.max_party_size || 8}
                    </div>
                  </Link>
                );
              })
            ) : (
              ["Venue Pro + Reserve for full booking control", "Reserve Standalone for dedicated booking businesses", "Nightlife-first waitlist and table pacing", "Discreet venue inquiry for EVNTSZN Reserve"].map((line) => (
                <div key={line} className="rounded-[28px] border border-white/10 bg-black/30 p-6 text-lg font-semibold text-white">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Reserve by city</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cityLinks.map(({ city, venues }) => (
              <Link key={city.slug} href={`${getReserveOrigin()}/${city.slug}`} className="rounded-[24px] border border-white/10 bg-black/25 p-4 transition hover:border-white/20">
                <div className="text-lg font-black text-white">{city.name}</div>
                <div className="mt-2 text-sm text-white/62">
                  {venues.length ? `${venues.length} Reserve-ready venue${venues.length === 1 ? "" : "s"}` : "City Reserve search page"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="reserve-plans" className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-section-kicker">Reserve pricing</div>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Choose the booking lane that matches the venue.</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {RESERVE_PLANS.map((plan) => (
            <div key={plan.title} className="rounded-[32px] border border-white/10 bg-black/30 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{plan.note}</div>
              <div className="mt-3 text-3xl font-black text-white">{plan.title}</div>
              <div className="mt-6 text-4xl font-black text-white">{plan.price}</div>
              <div className="mt-1 text-sm text-white/45">{plan.cadence}</div>
              <div className="mt-6 space-y-3 text-sm text-white/68">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">{point}</div>
                ))}
              </div>
              <Link href={plan.cta.href} className="ev-button-primary mt-6 w-full justify-center">
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="reserve-intake" className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="ev-panel p-6 md:p-8">
            <div className="ev-section-kicker">Routing</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Launch Reserve with one routed intake.</h2>
            <p className="mt-4 text-sm leading-6 text-white/65">
              The Reserve desk receives the plan, venue, market, and weekly volume so founder or HQ can assign the launch, route approvals, and track expected monthly Reserve revenue without a dead end.
            </p>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Reserve launch requests are tracked as live work items.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Venue and agreement follow-up can move directly into the correct desk without re-entry.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">If the venue is not yet cleared, start with the <Link href="/venue/agreement" className="text-white underline">venue agreement flow</Link>.</div>
            </div>
          </div>

          <ReserveIntakeForm />
        </div>
      </section>
    </PublicPageFrame>
  );
}
