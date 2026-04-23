import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import { buildCollectionPageSchema } from "@/lib/seo";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import SystemActivityRail from "@/components/public/SystemActivityRail";

export const metadata: Metadata = {
  title: "Tap to Pour | EVNTSZN",
  description: "Premium hospitality interaction layer for venues, bars, and service moments inside the EVNTSZN ecosystem.",
  alternates: {
    canonical: `${getWebOrigin()}/tap-to-pour`,
  },
};

export default function TapToPourPage() {
  return (
    <PublicPageFrame
      title="Tap to Pour"
      description="A premium hospitality interaction layer for venue service moments, operator flow, and faster real-world interactions."
      heroImage="https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "Tap to Pour",
        description:
          "Premium hospitality interaction layer for venue service moments inside the EVNTSZN stack.",
        path: "/tap-to-pour",
      })}
      seo={{
        title: "Tap to Pour | EVNTSZN",
        description: "Premium hospitality interaction layer for venues, bars, and service moments inside the EVNTSZN ecosystem.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Hospitality stack</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Service moments that feel faster, cleaner, and more premium.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Tap to Pour fits the EVNTSZN venue stack as the interaction layer for hospitality, venue service, and operational moments that need to move cleanly.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                "Premium venue service moments",
                "Faster interaction flow",
                "Works alongside Venue Pro and Reserve",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/72">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/venue/agreement?intent=tap-to-pour" className="ev-button-primary">
                Add to venue stack
              </Link>
              <Link href="/venue" className="ev-button-secondary">
                Back to Venue
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-[#a259ff]/25 bg-[#a259ff]/10 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]">Where it fits</div>
              <div className="mt-3 text-2xl font-black text-white">The hospitality layer of the stack.</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                It belongs with venue operations, reserve flow, and any real-world room that wants a more composed guest experience.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Related infrastructure</div>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Pair Tap to Pour with Nodes for discovery points and Reserve for visible booking pressure.
              </p>
              <Link href="/nodes" className="mt-5 inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Open Nodes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="venues" mode="compact" />

      <ProductTrustGrid
        title="Tap to Pour only makes sense if it reduces friction in the room."
        subtitle="It is the hospitality interaction layer for operators who want the service moment to feel quicker, cleaner, and more premium."
        proofTitle="Proof"
        proof={[
          { title: "Room-speed layer", body: "Built for interactions that need to move faster than a normal web page." },
          { title: "Venue-native", body: "It belongs inside venue operations, not as a standalone gimmick." },
          { title: "Stack fit", body: "It works alongside Venue Pro, Reserve, and Nodes." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "Faster service", body: "A more composed interaction layer supports the room and the team." },
          { title: "Higher trust", body: "The experience feels like an operational utility, not an experiment." },
          { title: "Cleaner flow", body: "Guests and staff get a more direct path through the hospitality moment." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Is this a standalone product?", answer: "No. It is intentionally tied to the venue stack." },
          { question: "Does it replace Reserve?", answer: "No. Reserve handles booking; Tap to Pour handles service moments." },
          { question: "Is it too abstract?", answer: "The page and product both keep it concrete: faster venue interactions." },
        ]}
        links={[
          { href: "/venue/pro", label: "See Venue Pro" },
          { href: "/venue/pro-reserve", label: "See Venue Pro + Reserve" },
          { href: "/nodes", label: "See Nodes" },
        ]}
      />
    </PublicPageFrame>
  );
}
