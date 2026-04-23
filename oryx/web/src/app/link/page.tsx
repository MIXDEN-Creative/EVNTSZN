import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Link | conversion-ready event pages",
  description:
    "Run one premium EVNTSZN Link page for events, profile traffic, Reserve, and sponsor-ready visibility.",
  path: "/link",
  origin: getWebOrigin(),
});

const LINK_PLANS = [
  {
    title: "Link Free",
    price: "$0",
    note: "Built for launch",
    points: ["Link page", "Event links", "Basic profile styling", "One clean public hub"],
    cta: { href: "/account/register?next=/link", label: "Start free" },
  },
  {
    title: "Link Pro",
    price: "$29",
    note: "Best for Partners",
    points: ["Advanced analytics", "Priority discovery", "Premium ticket fee pass-through", "Deeper event conversion tools"],
    cta: { href: "/account/register?next=/link", label: "Go Link Pro" },
  },
  {
    title: "Included with Venue Pro and network ops",
    price: "Included",
    note: "Inside the network",
    points: ["Link Pro access", "Venue Pro + Venue Pro + Reserve inclusion", "Curator routing", "Priority city visibility"],
    cta: { href: "/hosts", label: "Explore Curators" },
  },
];

export default function LinkPage() {
  return (
    <PublicPageFrame
      title="EVNTSZN Link"
      description="One clean profile for events, tickets, Reserve, sponsor placements, and conversion-ready traffic."
      heroImage="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Link",
        description:
          "Conversion-ready profile pages for events, Reserve, sponsor placements, and traffic flow.",
        path: "/link",
      })}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">EVNTSZN Link</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
              One page that moves traffic into the right room.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Link is the public layer for events, tickets, Reserve, venue activity, and sponsor-ready promotion. It is built to convert, not to look like a generic bio page.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                ["Conversion ready", "Push traffic into events, Reserve, or priority actions without clutter."],
                ["Partner fit", "Built for independent event operators who need one clean profile lane."],
                ["EVNTSZN Curator included", "EVNTSZN Curators keep Link inside the network with stronger discovery weight."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[22px] border border-white/10 bg-black/30 p-3.5">
                  <div className="text-sm font-black text-white">{title}</div>
                  <div className="mt-2 text-sm leading-5 text-white/62">{body}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/account/register?next=/link" className="ev-button-primary px-8">
                Start Link
              </Link>
              <Link href="/organizer" className="ev-button-secondary px-8">
                View Partner path
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            {[
              "Event drops and ticket conversion",
              "Reserve routing for nights out",
              "Sponsor placement support where needed",
              "Pulse-ready discovery links",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(162,89,255,0.16),rgba(255,255,255,0.03))] px-5 py-4 text-base font-semibold text-white">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-section-kicker">Link plans</div>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Clean pricing. No unreadable cards.</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {LINK_PLANS.map((plan) => (
            <article key={plan.title} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{plan.note}</div>
              <div className="mt-3 text-2xl font-black text-white">{plan.title}</div>
              <div className="mt-4 text-4xl font-black text-white">{plan.price}</div>
              <div className="mt-5 space-y-2.5 text-sm text-white/70">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-2.5">
                    {point}
                  </div>
                ))}
              </div>
              <Link href={plan.cta.href} className="ev-button-primary mt-5 w-full justify-center">
                {plan.cta.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicPageFrame>
  );
}
