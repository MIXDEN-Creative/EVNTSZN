import type { Metadata } from "next";
import Link from "next/link";
import EngagementBeacon from "@/components/engagement/EngagementBeacon";
import EngagementLoopPanel from "@/components/engagement/EngagementLoopPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import ReservePageClient from "@/components/evntszn/ReservePageClient";
import SystemActivityRail from "@/components/public/SystemActivityRail";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import { getReserveOrigin } from "@/lib/domains";
import { getReserveVenuesForPhase } from "@/lib/evntszn-phase";
import { buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Reserve | premium booking and waitlist control",
  description:
    "EVNTSZN Reserve is the premium booking product for nightlife tables, time slots, and waitlist pressure, with a calm OpenTable and Resy-style flow.",
  path: "/",
  origin: getReserveOrigin(),
});

export default async function ReservePage() {
  const venues = await getReserveVenuesForPhase();

  return (
    <PublicPageFrame
      title="Reserve should feel calm, premium, and immediately bookable."
      description="EVNTSZN Reserve is the booking product for nightlife tables, time slots, and waitlist pressure. The experience is simple, high-trust, and ready to convert."
      heroImage="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80"
      structuredData={[
        buildCollectionPageSchema({
          name: "EVNTSZN Reserve",
          description:
            "Premium booking, time slots, and waitlist pressure for nightlife tables and hospitality flow.",
          path: "/reserve",
        }),
        buildItemListSchema({
          name: "Reserve venues",
          path: "/reserve",
          items: venues.slice(0, 12).map((venue) => ({
            name: venue.name,
            url: `/reserve/${venue.slug}`,
          })),
        }),
      ]}
    >
      <main className="ev-public-page">
        <EngagementBeacon eventType="reserve_view" city={venues[0]?.city || "Baltimore"} referenceType="reserve" referenceId="reserve-home" dedupeKey={`reserve:view:${new Date().toISOString().slice(0, 10)}`} />
        <PulseActivityBeacon sourceType="reserve_view" city={venues[0]?.city || "Baltimore"} referenceType="reserve" referenceId="reserve-home" />
        <section className="ev-public-section py-8">
          <Badge>Reserve</Badge>
          <h1 className="ev-title max-w-5xl">Tables, time slots, waitlist pressure, and paid reservation holds.</h1>
          <p className="ev-subtitle max-w-3xl">
            EVNTSZN Reserve is the booking layer for nights out. It keeps the flow clean, keeps urgency visible, and keeps the next step obvious.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#reserve-listings" className="ev-button-primary">
              Open booking lane
            </Link>
            <Link href="/venue/pro-reserve" className="ev-button-secondary">
              Venue Pro + Reserve
            </Link>
            <Link href="/venue" className="ev-button-secondary">
              Back to venue
            </Link>
          </div>
        </section>

        <SystemActivityRail cityLabel={venues[0]?.city || "Baltimore"} audienceLabel="guests" mode="compact" />

        <section className="ev-public-section pb-8">
          <EngagementLoopPanel
            contextLabel="Reserve momentum"
            title="Reward premium planning and visible intent."
            body="Reserve contributes to your night-planning streak, weekly missions, and city run status through bookings, waitlists, and repeat premium planning behavior."
            actionHref="/enter"
            actionLabel="Enter member lane"
          />
        </section>

        <ProductTrustGrid
          title="Why Reserve beats a generic request form."
          subtitle="Guests are not left guessing. Reserve is built to feel calm, searchable, and commercially real."
          proofTitle="Proof"
          proof={[
            { title: "Live inventory", body: "The lane is built around visible time slots and waitlist pressure." },
            { title: "Public-safe route", body: "The booking flow is indexable and not hidden behind a dead-end CTA." },
            { title: "City-aware", body: "Reserve ties into the local nightlife and venue layer instead of existing alone." },
          ]}
          outcomesTitle="Outcomes"
          outcomes={[
            { title: "Higher intent", body: "The guest sees a clear next step and a premium booking experience." },
            { title: "Better fill", body: "Operators can use pressure and availability to convert demand." },
            { title: "Cleaner operations", body: "Reserve keeps the flow manageable instead of email-driven." },
          ]}
          objectionsTitle="Objections"
          objections={[
            { question: "Is this just for restaurants?", answer: "No. It supports nightlife tables, time slots, and premium hospitality flow." },
            { question: "Do we need Venue Pro?", answer: "Not to use Reserve, but Venue Pro makes the operator stack stronger." },
            { question: "Will guests understand it?", answer: "Yes. The whole page is built around a calm, direct booking story." },
          ]}
          links={[
            { href: "/venue", label: "Back to Venue" },
            { href: "/venue/pro-reserve", label: "Venue Pro + Reserve" },
            { href: "/nodes", label: "See Nodes" },
          ]}
        />

        <section id="reserve-listings" className="ev-public-section pb-8">
          <ReservePageClient venues={venues} />
        </section>

        <section className="ev-public-section pb-14">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Limited availability", "Urgency stays visible so the first session has tension."],
              ["Live time slots", "Guests book from visible inventory, not a blind request form."],
              ["Trustworthy checkout", "Paid holds route cleanly without exposing unfinished fallback states."],
            ].map(([title, body]) => (
              <Card key={title}>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="mt-3">{body}</CardDescription>
              </Card>
            ))}
          </div>
        </section>

        <section className="ev-public-section pb-14">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Venue", "/venue", "Back to venue visibility and onboarding."],
              ["Venue Pro", "/venue/pro", "Upgrade into the operating layer."],
              ["Nodes", "/nodes", "Add discovery points to the reserve stack."],
              ["Tap to Pour", "/tap-to-pour", "Add the hospitality interaction layer."],
            ].map(([label, href, body]) => (
              <Link key={label} href={href} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{label}</div>
                <p className="mt-3 text-sm leading-6 text-white/64">{body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicPageFrame>
  );
}
