import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getStayOpsOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EVNTSZN StayOps | Premium short-term rental operations system",
  description: "EVNTSZN StayOps is a premium short-term rental operations system with Core Ops, Pro Ops, Elite / Concierge, event-linked pricing, and operator-grade intake.",
  alternates: {
    canonical: `${getStayOpsOrigin()}/`,
  },
  openGraph: {
    title: "EVNTSZN StayOps",
    description: "Premium property revenue operations for short-term rental assets.",
    url: `${getStayOpsOrigin()}/`,
    siteName: "EVNTSZN StayOps",
    type: "website",
  },
};

const STAYOPS_TIERS = [
  {
    name: "Core Ops",
    note: "Tier 1",
    price: "15%",
    points: [
      "Automation",
      "Messaging",
      "Calendar + pricing",
      "Basic support",
    ],
  },
  {
    name: "Pro Ops",
    note: "Tier 2",
    price: "20%",
    points: [
      "Everything in Core",
      "Dynamic pricing",
      "Cleaning coordination",
      "Guest support",
      "Listing optimization",
    ],
  },
  {
    name: "Elite / Concierge",
    note: "Tier 3",
    price: "30%",
    points: [
      "Full management",
      "Event integration (EVNTSZN advantage)",
      "Guest experience upgrades",
      "Revenue optimization strategy",
      "VIP guest handling",
    ],
  },
];

export default function StayOpsPage() {
  return (
    <PublicPageFrame
      title="StayOps turns short-term rentals into operated revenue assets."
      description="A premium short-term rental operations system built around hospitality quality, pricing discipline, and EVNTSZN's advantage around city movement, events, nightlife, and group demand."
      heroImage="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[36px] border border-white/10 bg-[#0c0c15] p-7 md:p-9">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">EVNTSZN StayOps</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Revenue operations for short-term rental properties.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              StayOps is a premium short-term rental operations system. We optimize and operate your property as a revenue asset with tighter standards across guest communication, pricing, turnover coordination, booking sync, and financial visibility.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "Event-linked pricing captures demand around nightlife, league activity, concerts, destination weekends, and group movement.",
                "Stay-near-the-event logic turns EVNTSZN demand into premium group booking opportunities instead of disconnected lodging traffic.",
                "The operating model starts as an overlay system, standardizes into a repeatable operating layer, and points toward StayOS.",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-black/25 px-5 py-4 text-sm leading-6 text-white/64">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/stayops/intake" className="ev-button-primary">
                Get Started
              </Link>
              <Link href="/enter" className="ev-button-secondary">
                Enter EVNTSZN
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              ["Service", "Done-for-you management across guest communication, turnovers, booking sync, and owner reporting."],
              ["System", "Standardized operations, pricing discipline, and automation-oriented workflows across the property stack."],
              ["Software", "Future-facing StayOS positioning for proprietary PMS, financial control, and differentiated owner tooling."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{title}</div>
                <div className="mt-3 text-2xl font-black text-white">{title === "Software" ? "Roadmap toward StayOS." : `${title} layer.`}</div>
                <p className="mt-3 text-sm leading-6 text-white/62">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-3">
          {STAYOPS_TIERS.map((tier) => (
            <article key={tier.name} className="rounded-[30px] border border-white/10 bg-black/30 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{tier.note}</div>
              <div className="mt-3 text-3xl font-black text-white">{tier.name}</div>
              <div className="mt-3 text-5xl font-black tracking-tight text-white">{tier.price}</div>
              <div className="mt-5 grid gap-3">
                {tier.points.map((point) => (
                  <div key={point} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/68">
                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Add-ons</div>
            <div className="mt-3 text-3xl font-black text-white">Asset launch and upgrade support.</div>
            <div className="mt-5 grid gap-3">
              {[
                "Listing setup: $300-$1,000",
                "Photography: $150-$500",
                "Furnishing/design: markup",
                "Event packages: premium upsell",
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Roadmap</div>
            <div className="mt-3 text-3xl font-black text-white">Phase the system. Then deepen the moat.</div>
            <div className="mt-5 grid gap-3">
              {[
                "Phase 1: Overlay system coordinating property operations across existing channel and hospitality tools.",
                "Phase 2: EVNTSZN StayOS for pricing, guest flows, financial tracking, and owner visibility.",
                "Phase 3: Differentiation built on event-linked demand intelligence, group bookings, and city movement data.",
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white/68">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/stayops/intake" className="ev-button-primary">Apply for StayOps</Link>
              <Link href="/enter" className="ev-button-secondary">Enter</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
