import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import {
  BOOSTED_MOMENTS,
  FEATURED_VENUE_PLACEMENT,
  NODES_PRICING,
  SMART_FILL_RULES,
  VENUE_PLANS,
} from "@/lib/evntszn-business";

export const metadata: Metadata = {
  title: "EVNTSZN Venue Plans",
  description:
    "Compare EVNTSZN Venue, Venue Pro, Venue Pro with Reserve, Nodes, Smart Fill, and venue agreement workflow.",
  alternates: {
    canonical: `${getWebOrigin()}/venue-program`,
  },
};

export default function VenueProgramPage() {
  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.2),transparent_36%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
          <div className="ev-kicker">Venue architecture</div>
          <h1 className="ev-title max-w-5xl">Venue listing, venue operations, and Reserve all live in one clear structure.</h1>
          <p className="ev-subtitle max-w-3xl">
            Start with a free venue listing, move into Venue Pro for Smart Fill, Nodes, messaging, Pulse, and event requests, then add Reserve when reservations need to live inside the same operating system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/venue-agreement?intent=venue-onboarding" className="ev-button-primary">
              Start venue onboarding
            </Link>
            <Link href="/reserve" className="ev-button-secondary">
              Explore Reserve
            </Link>
            <Link href="/venue-agreement" className="ev-button-secondary">
              Venue agreement workflow
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {VENUE_PLANS.map((plan, index) => (
            <div key={plan.key} className={`rounded-[32px] border p-6 ${index === 2 ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">{plan.sublabel}</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-white">{plan.label}</div>
              <div className="mt-2 text-sm font-semibold text-white/70">{plan.priceLabel}</div>
              <div className="mt-5 grid gap-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                    {feature}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-white/62">{plan.note}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Nodes</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Tap points, discovery, and waitlist entry.</div>
            <div className="mt-5 grid gap-3">
              {NODES_PRICING.map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Smart Fill</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Demand routing for listed venues.</div>
            <div className="mt-5 grid gap-3">
              {SMART_FILL_RULES.map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Paid visibility</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Boosted moments and featured placement.</div>
            <div className="mt-5 grid gap-3">
              {[...BOOSTED_MOMENTS, ...FEATURED_VENUE_PLACEMENT].map((item) => (
                <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 ev-panel p-6">
          <div className="ev-section-kicker">Agreement workflow</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">When the venue is not listed, the written venue agreement is part of the product path.</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "If the venue is already listed on EVNTSZN, the venue agreement workflow can still be used for approval routing and venue confirmation.",
              "If the venue is not listed, the written venue agreement is required and can be completed and sent on-platform.",
              "Hosts, Certified Hosts, Pro Hosts, and City Leaders all use the same agreement surface, but the approval stack changes by role and market.",
              "Reserve, Venue Pro, and host-based venue operation should route into the same agreement intake when written venue approval is needed.",
            ].map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/76">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/venue-agreement" className="ev-button-primary">
              Open venue agreement workflow
            </Link>
          </div>
        </section>
      </section>
    </PublicPageFrame>
  );
}
