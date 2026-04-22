import Link from "next/link";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import EplRegistrationClient from "@/components/evntszn/EplRegistrationClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { EVNTSZN_CITIES, getEplHooks } from "@/lib/evntszn-phase";

export default async function EplPage() {
  const hooks = await getEplHooks();
  return (
    <PublicPageFrame
      title="EPL is a real league product, not a dead branch."
      description="Prime League keeps registration, standings, schedules, clubs, and game-week momentum in one public surface with operational seriousness."
      heroImage="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1800&q=80"
    >
      <main className="ev-public-page">
        <PulseActivityBeacon sourceType="epl_view" city="Baltimore" referenceType="epl" referenceId="landing" />
        <section className="ev-public-section py-8">
          <Badge>EPL</Badge>
          <h1 className="ev-title max-w-5xl">Remote-first city league operations.</h1>
          <p className="ev-subtitle max-w-3xl">
            EPL runs teams, standings, schedule, and registration without depending on physical infrastructure.
          </p>
        </section>

        <section className="ev-public-section pb-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Teams", "/epl/teams", "City teams stay visible even before full league density exists."],
              ["Standings", "/epl/standings", "Keep motion and narrative alive each week."],
              ["Schedule", "/epl/schedule", "Operate game flow city by city."],
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

        <section className="ev-public-section pb-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {EVNTSZN_CITIES.map((city) => (
              <div key={city.slug}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/epl/${city.slug}`} className="block">
                      <CardTitle>{city.name}</CardTitle>
                      <CardDescription className="mt-3">{city.label}</CardDescription>
                    </Link>
                    <SaveToggle
                      item={{
                        intent: "watch",
                        entityType: "epl_city",
                        entityKey: city.slug,
                        title: `${city.name} EPL`,
                        href: `/epl/${city.slug}`,
                        city: city.name,
                        state: city.state,
                      }}
                      inactiveLabel="Watch city"
                      activeLabel="Watching city"
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section className="ev-public-section pb-8">
          <div className="grid gap-5 md:grid-cols-3">
            {hooks.map((hook) => (
              <Link key={hook.id} href={hook.href} className="block">
                <Card className="h-full">
                  <CardTitle>{hook.title}</CardTitle>
                  <CardDescription className="mt-3">{hook.detail}</CardDescription>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="ev-public-section pb-14">
          <EplRegistrationClient />
        </section>
      </main>
    </PublicPageFrame>
  );
}
