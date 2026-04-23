import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Partners | independent event organizers",
  description:
    "Run events independently with EVNTSZN tools, ticketing, Pulse access, and Link support.",
  path: "/partners",
  origin: getWebOrigin(),
});

const PARTNER_PLANS = [
  {
    title: "Partner",
    price: "$0",
    note: "$0.99 per ticket",
    points: ["Event posting", "Link free tier", "Pulse Feed access", "Smart Fill standard pricing"],
  },
  {
    title: "Partner Pro",
    price: "$29",
    note: "$0.99 per ticket",
    points: ["Link Pro", "Advanced analytics", "Priority discovery", "Lower Smart Fill pricing", "Premium ticket fee pass-through"],
  },
];

export default function PartnersPage() {
  return (
    <PublicPageFrame
      title="EVNTSZN Partners"
      description="Run events independently with EVNTSZN tools, ticketing, Pulse access, and Link support."
      heroImage="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Partners",
        description:
          "Independent organizers using EVNTSZN for ticketing, discovery, Pulse, and Link support.",
        path: "/partners",
      })}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-6 md:p-8">
            <div className="ev-section-kicker">Partner system</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Build your own events without leaving EVNTSZN.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              Partners run independently. You keep your own event lane, ticketing, brand, and audience while using EVNTSZN for discovery, Pulse, Link, and operations.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Post events and sell tickets without entering the Curator split structure.",
                "Use Link, Pulse, Crew, and Reserve paths where the event needs them.",
                "Upgrade to Partner Pro for stronger analytics, discovery, and pricing leverage.",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4 text-sm leading-6 text-white/72">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/organizer/apply" className="ev-button-primary">Apply as Partner</Link>
              <Link href="/organizer" className="ev-button-secondary">Open Partner lane</Link>
            </div>
          </div>

          <div className="grid gap-4">
            {PARTNER_PLANS.map((plan) => (
              <div key={plan.title} className="rounded-[28px] border border-white/10 bg-black/30 p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{plan.note}</div>
                <div className="mt-3 text-3xl font-black text-white">{plan.title}</div>
                <div className="mt-3 text-3xl font-black text-white">{plan.price}</div>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  {plan.points.map((point) => (
                    <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
