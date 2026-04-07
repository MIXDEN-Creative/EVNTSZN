import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getAppOrigin, getHostsOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EVNTSZN Host Network",
  description:
    "Learn how the EVNTSZN Host Network works, what host operators do, and how approved operators move into city-level event execution.",
  alternates: {
    canonical: `${getHostsOrigin()}/`,
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
            <Link href={`${getHostsOrigin()}/apply`} className="ev-button-primary">
              Start operator application
            </Link>
            <Link href={`${getAppOrigin()}/account/login?next=/ops`} className="ev-button-secondary">
              Already approved? Enter ops
            </Link>
            <Link href="/organizer/apply" className="ev-button-secondary">
              Independent Organizer instead?
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
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
            <div className="ev-section-kicker">Signal</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Controlled city support and activation</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Signal is for controlled support, activation, and city help. It is separate from Ambassador and it does not automatically grant broad operator privileges.
            </p>
            <div className="mt-5">
              <Link href="/signal/apply" className="ev-button-secondary">Request Signal consideration</Link>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Ambassador</div>
            <div className="mt-3 text-2xl font-black tracking-tight text-white">Growth, referrals, and city awareness</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Ambassador is the public-facing growth path for referral pull and city presence. It is not the same program as Signal and it is not the same track as approved EVNTSZN Hosts.
            </p>
            <div className="mt-5">
              <Link href="/ambassador/apply" className="ev-button-secondary">Apply to Ambassador</Link>
            </div>
          </section>
        </div>
      </section>
    </PublicPageFrame>
  );
}
