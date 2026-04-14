import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getAppOrigin, getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EVNTSZN Link",
  description:
    "Turn events, drops, and audience attention into one clean conversion page with EVNTSZN Link.",
  alternates: {
    canonical: `${getWebOrigin()}/link`,
  },
  openGraph: {
    title: "EVNTSZN Link",
    description:
      "Turn events, drops, and audience attention into one clean conversion page with EVNTSZN Link.",
    url: `${getWebOrigin()}/link`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Link",
    description:
      "Turn events, drops, and audience attention into one clean conversion page with EVNTSZN Link.",
  },
};

export default function LinkProgramPage() {
  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.24),transparent_36%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
          <div className="ev-kicker">EVNTSZN Link</div>
          <h1 className="ev-title max-w-5xl">
            A conversion page for events, drops, and audience momentum.
          </h1>
          <p className="ev-subtitle max-w-3xl">
            EVNTSZN Link is the top-level creator funnel inside EVNTSZN. Put live events, ticket pushes, digital offers, social links, and lead capture into one page built to move traffic instead of wasting it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`${getAppOrigin()}/account/register?next=${encodeURIComponent("/account/link")}`} className="ev-button-primary">
              Start free
            </Link>
            <Link href={`${getAppOrigin()}/account/link`} className="ev-button-secondary">
              Open Link manager
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Built for event traffic",
              body: "Feature live events, ticket links, and the next action clearly instead of dropping people into a generic profile page.",
            },
            {
              title: "Built for operators",
              body: "Hosts and Independent Organizers can run one page that connects discovery, event promotion, and audience capture without juggling disconnected tools.",
            },
            {
              title: "Built to upgrade cleanly",
              body: "Start free, then unlock stronger funnel blocks, lead capture, and optimization tools when the page becomes a revenue lane.",
            },
          ].map((item) => (
            <section key={item.title} className="ev-panel p-6">
              <div className="ev-section-kicker">Why it exists</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-white">{item.title}</div>
              <p className="mt-3 text-sm leading-6 text-white/72">{item.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 ev-panel p-6">
          <div className="ev-section-kicker">Pricing</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">
            Free to start. Clear reasons to upgrade.
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Free", "$0", "Basic link page, EVNTSZN branding, 1 active event link, basic analytics."],
              ["Starter", "$7/mo", "Remove EVNTSZN branding, unlimited links, simple customization, multiple events, basic funnel tracking."],
              ["Pro", "$15/mo", "Full funnel page blocks, EVNTSZN-native conversion lanes, lead capture, advanced analytics."],
              ["Elite", "$29/mo", "Priority placement support, advanced optimization controls, reserved A/B and CRM-lite controls."],
              ["Enterprise", "$79-$199/mo", "Multi-page operator setups, team access, revenue dashboards, and city-wide funnel analytics."],
            ].map(([title, price, body], index) => (
              <div key={title} className={`rounded-[24px] border p-5 ${index === 2 ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/10 bg-white/5"}`}>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">{title}</div>
                <div className="mt-3 text-2xl font-black tracking-tight text-white">{price}</div>
                <p className="mt-3 text-sm leading-6 text-white/68">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </PublicPageFrame>
  );
}
