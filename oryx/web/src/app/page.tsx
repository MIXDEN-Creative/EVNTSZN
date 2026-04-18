import Link from "next/link";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import ReturnTrigger from "@/components/evntszn/ReturnTrigger";
import SaveToggle from "@/components/evntszn/SaveToggle";
import YourNightPanel from "@/components/evntszn/YourNightPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDiscoverFeed } from "@/lib/evntszn-phase";

export default async function HomePage() {
  const { feed, zones, tonight, eplHooks } = await getDiscoverFeed();

  return (
    <main className="ev-public-page">
      <PulseActivityBeacon sourceType="discover_view" city="Baltimore" referenceType="discover" referenceId="homepage" />
      <section className="ev-public-section py-8">
        <Badge>EVNTSZN Live Feed</Badge>
        <h1 className="ev-title max-w-5xl">A live city operating system, not a dead events page.</h1>
        <p className="ev-subtitle max-w-3xl">
          Discover trending zones, what&apos;s happening tonight, reserve pressure, and movement across Baltimore, DC, Ocean City, Rehoboth, Bethany, Dewey, and Fenwick.
        </p>
      </section>

      <section className="ev-public-section grid gap-6 pb-8 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-2xl">Tonight</CardTitle>
            <div className="text-sm font-semibold text-white/65">Best move now, what builds later, and what to watch</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {tonight.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{item.city}</div>
                    <div className="mt-2 text-xl font-black text-white">{item.title}</div>
                  </div>
                  <Badge>{item.timing}</Badge>
                </div>
                <CardDescription className="mt-3">{item.detail}</CardDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={item.href} className="rounded-full border border-white bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                    {item.actionLabel}
                  </Link>
                  <SaveToggle
                    item={{
                      intent: "watch",
                      entityType: item.href.startsWith("/reserve") ? "reserve" : item.href.startsWith("/epl") ? "epl_city" : "event",
                      entityKey: item.href,
                      title: item.title,
                      href: item.href,
                      city: item.city,
                    }}
                    inactiveLabel="Watch"
                    activeLabel="Watching"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-2xl">What&apos;s happening tonight</CardTitle>
            <Link href="/map" className="text-sm font-semibold text-white/72 underline underline-offset-4">
              Open map
            </Link>
          </div>
          <div className="space-y-3">
            {feed.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{item.city}</div>
                    <Link href={item.href} className="mt-2 block text-xl font-black text-white">{item.title}</Link>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>{item.statusLabel}</Badge>
                    {item.timingLabel ? <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{item.timingLabel}</div> : null}
                  </div>
                </div>
                <CardDescription className="mt-3">{item.subtitle}</CardDescription>
                <div className="mt-4">
                  <SaveToggle
                    item={{
                      intent: "save",
                      entityType: item.href.startsWith("/reserve") ? "reserve" : "event",
                      entityKey: item.href,
                      title: item.title,
                      href: item.href,
                      city: item.city,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
        <YourNightPanel />
        <Card className="space-y-4">
          <CardTitle className="text-2xl">Trending zones</CardTitle>
          <div className="grid gap-3">
            {zones.slice(0, 5).map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-white">{zone.city}</div>
                    <div className="text-sm text-white/58">{zone.label}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>{zone.state}</Badge>
                    {zone.tonightLabel ? <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{zone.tonightLabel}</div> : null}
                  </div>
                </div>
                <div className="mt-4 text-4xl font-black text-white">{zone.pulse}</div>
                <CardDescription className="mt-2">{zone.nowLabel}</CardDescription>
                {zone.momentumLabel ? <div className="mt-2 text-sm text-white/58">{zone.momentumLabel}</div> : null}
              </div>
            ))}
          </div>
        </Card>
        </div>
      </section>

      <section className="ev-public-section pb-8">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-2xl">EPL in the city loop</CardTitle>
              <Link href="/epl" className="text-sm font-semibold text-white/72 underline underline-offset-4">Open EPL</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {eplHooks.map((hook) => (
                <Link key={hook.id} href={hook.href} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                  <div className="text-lg font-black text-white">{hook.title}</div>
                  <CardDescription className="mt-3">{hook.detail}</CardDescription>
                </Link>
              ))}
            </div>
          </Card>
          <ReturnTrigger href="/map" />
        </div>
      </section>

      <section className="ev-public-section pb-14">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Reserve", "/reserve", "Primary revenue via paid holds and waitlist conversion."],
            ["Crew", "/crew", "Book the people that make the room work."],
            ["Venues", "/venues", "Free listing and Smart Fill entry."],
          ].map(([title, href, body]) => (
            <Link key={href} href={href} className="block">
              <Card className="h-full">
                <CardTitle>{title}</CardTitle>
                <CardDescription className="mt-3">{body}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
