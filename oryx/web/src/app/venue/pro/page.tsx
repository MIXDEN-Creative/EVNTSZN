import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import { buildCollectionPageSchema } from "@/lib/seo";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import SystemActivityRail from "@/components/public/SystemActivityRail";

export const metadata: Metadata = {
  title: "EVNTSZN Venue Pro",
  description: "Premium venue tooling for messaging, demand support, Smart Fill, Nodes, and stronger visibility inside EVNTSZN.",
  alternates: {
    canonical: `${getWebOrigin()}/venue/pro`,
  },
};

export default function VenueProPage() {
  return (
    <PublicPageFrame
      title="Venue Pro"
      description="The premium venue operating layer for messaging, demand support, Smart Fill, Nodes, and deeper visibility in EVNTSZN."
      heroImage="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Venue Pro",
        description:
          "Premium venue tooling for messaging, demand support, Smart Fill, and network visibility.",
        path: "/venue/pro",
      })}
      seo={{
        title: "EVNTSZN Venue Pro",
        description: "Premium venue tooling for messaging, demand support, Smart Fill, Nodes, and stronger visibility inside EVNTSZN.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Venue stack</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Premium venue tooling that makes the room easier to run.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Venue Pro is the operational layer for venue groups that want smarter fill, better messaging, stronger discovery, and more control over demand.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                "Smart Fill and demand routing",
                "Nodes and venue discovery points",
                "Messaging and visibility inside the network",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/72">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/venue/agreement?intent=venue-pro" className="ev-button-primary">
                Activate Venue Pro
              </Link>
              <Link href="/venue" className="ev-button-secondary">
                Back to Venue
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-[#a259ff]/25 bg-[#a259ff]/10 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]">What it unlocks</div>
              <div className="mt-3 text-2xl font-black text-white">Visibility, control, and cleaner demand flow.</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Venue Pro is built for venues that want to behave like a serious system, not a static listing.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Next step</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                If you need reservations and waitlist control inside the same lane, move into Venue Pro + Reserve.
              </p>
              <Link href="/venue/pro-reserve" className="mt-5 inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                See Venue Pro + Reserve
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="venues" mode="compact" />

      <ProductTrustGrid
        title="Venue Pro is the step up when visibility alone is not enough."
        subtitle="This tier is for operators who need more than a listing: they need demand control, messaging, and a cleaner path to fill."
        proofTitle="Proof"
        proof={[
          { title: "Operational layer", body: "Smart Fill, Nodes, messaging, and visibility sit on top of the venue lane." },
          { title: "Network presence", body: "The room becomes part of a wider EVNTSZN operating system, not a standalone profile." },
          { title: "Upgrade path", body: "The page clearly points forward into Reserve when booking pressure starts to matter." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "Better demand control", body: "You can steer traffic instead of waiting for it to arrive." },
          { title: "Higher trust", body: "Operators see a premium system with a real next step, not a generic upsell." },
          { title: "Fewer dead ends", body: "The venue stack connects into reserve, tap points, and routing." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Is Venue Pro just a nicer listing?", answer: "No. It adds the operating layer that the free venue lane does not have." },
          { question: "Does it require Reserve?", answer: "No, but it is designed to move there naturally when the business needs booking flow." },
          { question: "Is it too much for a smaller venue?", answer: "Not if you want discovery and control. The upgrade can be staged." },
        ]}
        links={[
          { href: "/venue", label: "Back to Venue" },
          { href: "/venue/pro-reserve", label: "See Venue Pro + Reserve" },
          { href: "/nodes", label: "See Nodes" },
        ]}
      />
    </PublicPageFrame>
  );
}
