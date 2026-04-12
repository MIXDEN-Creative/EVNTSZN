import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getAppOrigin, getHostsOrigin, getLoginUrl, getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EVNTSZN Host Network",
  description:
    "Learn how the EVNTSZN Host Network works, what host operators do, and how approved operators move into city-level event execution.",
  alternates: {
    canonical: `${getHostsOrigin()}/`,
  },
  openGraph: {
    title: "EVNTSZN Host Network",
    description:
      "Learn how the EVNTSZN Host Network works, what host operators do, and how approved operators move into city-level event execution.",
    url: `${getHostsOrigin()}/`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Host Network",
    description:
      "Learn how the EVNTSZN Host Network works, what host operators do, and how approved operators move into city-level event execution.",
  },
};

export default function HostsPage() {
  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
          <div className="ev-kicker">Host Network</div>
          <h1 className="ev-title max-w-5xl">
            Become the operator behind premium city events, not just another generic promoter.
          </h1>
          <p className="ev-subtitle max-w-2xl">
            The EVNTSZN Host Network is for approved operators who can create energy, run a room, manage a guest lane, and execute events with the same premium standard the public brand promises.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`${getWebOrigin()}/hosts/apply`} className="ev-button-primary">
              Start operator application
            </Link>
            <Link href={getLoginUrl("/ops", "app.evntszn.com")} className="ev-button-secondary">
              Already approved? Enter ops
            </Link>
            <Link href={`${getWebOrigin()}/organizer/apply`} className="ev-button-secondary">
              Independent Organizer instead?
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Open host markets</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Current EVNTSZN Host openings</div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            We are actively reviewing hosts for Baltimore, Atlanta, New York, Miami, DC, and Dover. Approved hosts work premium city nights, operate inside the live host commission structure, and build toward deeper city-office responsibility.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              "Baltimore, MD",
              "Atlanta, GA",
              "New York, NY",
              "Miami, FL",
              "Washington, DC",
              "Dover, DE",
            ].map((market) => (
              <div key={market} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/78">
                {market}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Host",
              body: "Run rooms, guest flow, and event energy at the city level with clear operating standards and event-day discipline.",
            },
            {
              title: "Certified Host",
              body: "Move beyond room energy into repeat execution, team coordination, and trust for higher-visibility EVNTSZN moments.",
            },
            {
              title: "Pro Host",
              body: "Operate larger nights, mentor new hosts, and step into city-office collaboration when the market needs stronger field leadership.",
            },
          ].map((item) => (
            <div key={item.title} className="ev-panel p-6">
              <div className="ev-section-kicker">Pathway</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-white">{item.title}</div>
              <p className="mt-3 text-sm leading-6 text-white/72">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">What approved hosts do</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "Create and shape live event energy",
                "Handle guest-facing execution and room discipline",
                "Coordinate scanner and check-in support when assigned",
                "Operate inside city, venue, and EVNTSZN standards",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/74">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Why hosts step in</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Revenue, city growth, and bigger nights</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/74">
              <p>Approved host-led events work inside the live EVNTSZN host commission structure, so the nights you lead can build real host-side upside.</p>
              <p>Hosts also build toward certified and pro pathways, city-office coordination, stronger event support, and bigger nights in market.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Host perks</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                "Direct host-led revenue participation on qualifying events",
                "Scanner and check-in support when the event needs it",
                "City-office collaboration and escalation path",
                "Priority visibility for stronger operators and repeat execution",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/74">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">How approval works</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/74">
              <p>Public visitors can start a request for ops access, but elevated roles are not granted automatically.</p>
              <p>Organizer, venue, scanner, host, and city-operating permissions remain subject to review and approval by EVNTSZN admin or HQ controls.</p>
              <p>Once approved, operators are routed into the correct protected workspace with only the capabilities their role allows.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">EVNTSZN Link</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Give every creator a conversion page, not just a profile.</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Anyone can start an EVNTSZN Link, then scale into stronger funnel tools as their events grow.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`${getAppOrigin()}/account/register?next=${encodeURIComponent("/account/link")}`} className="ev-button-primary">Start free</Link>
              <Link href={`${getAppOrigin()}/account/link`} className="ev-button-secondary">Open EVNTSZN Link</Link>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Signal</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Controlled city support and activation</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Signal is for controlled support, activation, and city help. It is separate from Ambassador and it does not automatically grant broad operator privileges.
            </p>
            <div className="mt-5">
              <Link href={`${getWebOrigin()}/signal/apply`} className="ev-button-secondary">Request Signal consideration</Link>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Ambassador</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Growth, referrals, and city awareness</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Ambassador is the public-facing growth path for referral pull and city presence. It is not the same program as Signal and it is not the same track as approved EVNTSZN Hosts.
            </p>
            <div className="mt-5">
              <Link href={`${getWebOrigin()}/ambassador/apply`} className="ev-button-secondary">Apply to Ambassador</Link>
            </div>
          </section>
        </div>

        <section className="mt-8 ev-panel p-6">
          <div className="ev-section-kicker">Link pricing</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Start free, upgrade when the page turns into a sales engine.</div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Free Tier", "$0", "Basic link page, EVNTSZN branding, 1 active event link, basic analytics."],
              ["Starter Tier", "$7/mo", "Remove branding, unlimited links, simple themes, multiple events, funnel tracking."],
              ["Pro Tier", "$15/mo", "Full funnel pages, EVNTSZN-native ticket embeds, lead capture, advanced analytics."],
              ["Elite Tier", "$29/mo", "AI funnel builder, A/B testing, discovery priority, CRM-lite, monetization tools."],
              ["Enterprise / City", "$79-$199/mo", "Multi-page ops, team access, revenue dashboards, city-wide funnel analytics."],
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
