import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getReserveOrigin, getWebOrigin } from "@/lib/domains";
import { buildCollectionPageSchema } from "@/lib/seo";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import SystemActivityRail from "@/components/public/SystemActivityRail";

export const metadata: Metadata = {
  title: "EVNTSZN Venue Pro + Reserve",
  description: "Venue Pro plus the reservation engine for nightlife booking, waitlist control, and premium hospitality operations.",
  alternates: {
    canonical: `${getWebOrigin()}/venue/pro-reserve`,
  },
};

export default function VenueProReservePage() {
  return (
    <PublicPageFrame
      title="Venue Pro + Reserve"
      description="The venue operating ladder with reservations, waitlists, and premium hospitality flow in one composed system."
      heroImage="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Venue Pro + Reserve",
        description:
          "Venue operations combined with reservations, waitlists, and premium hospitality flow.",
        path: "/venue/pro-reserve",
      })}
      seo={{
        title: "EVNTSZN Venue Pro + Reserve",
        description: "Venue Pro plus the reservation engine for nightlife booking, waitlist control, and premium hospitality operations.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Venue ladder</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              The reserve-enabled venue stack.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Venue Pro + Reserve combines venue operations with the booking engine, giving nightlife spaces a clean path to reservations, waitlists, and premium guest flow.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                "Reservations and time slots",
                "Waitlist pressure and fills",
                "Venue-aware hospitality operations",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/72">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/reserve" className="ev-button-primary">
                Activate Reserve
              </Link>
              <Link href="/venue/agreement?intent=venue-pro-reserve" className="ev-button-secondary">
                Start venue agreement
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-[#a259ff]/25 bg-[#a259ff]/10 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]">Why it matters</div>
              <div className="mt-3 text-2xl font-black text-white">Bookable, visible, and easier to manage.</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                It turns venue demand into a composed workflow instead of a scattered intake loop.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Reserve origin</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Reserve always remains its own lane for guests, but the venue stack brings it into the operator flow.
              </p>
              <Link href={`${getReserveOrigin()}/`} className="mt-5 inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Open Reserve surface
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="venues" mode="compact" />

      <ProductTrustGrid
        title="When venue demand needs booking control, this is the full system."
        subtitle="Venue Pro + Reserve is for operators who want reservations, waitlists, and premium hospitality flow without splitting the venue stack."
        proofTitle="Proof"
        proof={[
          { title: "Reserve is built in", body: "Reservations, time slots, and waitlist control are not side features; they are the lane." },
          { title: "Venue-aware workflow", body: "The booking engine is tied to venue operations and follow-through." },
          { title: "Commercial logic", body: "The system supports a real revenue model instead of a placeholder booking screen." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "More bookable", body: "Guests can move from discovery into a clean reservation flow." },
          { title: "More manageable", body: "Operators get capacity and waitlist control in the same lane." },
          { title: "More premium", body: "The booking experience feels like a high-trust hospitality product." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Do we lose the venue identity?", answer: "No. The venue identity stays visible and gets stronger with Reserve attached." },
          { question: "Can Reserve work elsewhere?", answer: "Yes, but Venue Pro + Reserve makes it feel operationally native." },
          { question: "Is the change too heavy?", answer: "The ladder is designed to be clear, staged, and easy to activate." },
        ]}
        links={[
          { href: "/reserve", label: "Open Reserve" },
          { href: "/venue/pro", label: "See Venue Pro" },
          { href: "/tap-to-pour", label: "See Tap to Pour" },
        ]}
      />
    </PublicPageFrame>
  );
}
