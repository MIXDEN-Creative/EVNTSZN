import type { Metadata } from "next";
import EngagementBeacon from "@/components/engagement/EngagementBeacon";
import EngagementLoopPanel from "@/components/engagement/EngagementLoopPanel";
import Link from "next/link";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import EplRegistrationClient from "@/components/evntszn/EplRegistrationClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ProductTrustGrid from "@/components/public/ProductTrustGrid";
import SystemActivityRail from "@/components/public/SystemActivityRail";
import { EVNTSZN_CITIES, getEplHooks } from "@/lib/evntszn-phase";
import { buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "@/lib/seo";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN EPL | real league operations, teams, and schedule",
  description:
    "EVNTSZN EPL is a real league product with teams, schedule, standings, registration, and supporter progression inside one public surface.",
  path: "/epl",
  origin: getWebOrigin(),
});

export default async function EplPage() {
  const hooks = await getEplHooks();
  return (
    <PublicPageFrame
      title="EPL is a real league product, not a dead branch."
      description="Prime League keeps registration, standings, schedules, clubs, and game-week momentum in one public surface with operational seriousness."
      heroImage="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1800&q=80"
      structuredData={[
        buildCollectionPageSchema({
          name: "EVNTSZN EPL",
          description:
            "League operations, teams, schedule, standings, and supporter progression.",
          path: "/epl",
        }),
        buildItemListSchema({
          name: "EPL action lanes",
          path: "/epl",
          items: [
            { name: "Teams", url: "/epl/teams" },
            { name: "Standings", url: "/epl/standings" },
            { name: "Schedule", url: "/epl/schedule" },
            { name: "Opportunities", url: "/epl/opportunities" },
          ],
        }),
      ]}
    >
      <main className="ev-public-page">
        <EngagementBeacon eventType="epl_view" city="Baltimore" referenceType="epl" referenceId="landing" dedupeKey={`epl:view:${new Date().toISOString().slice(0, 10)}`} />
        <PulseActivityBeacon sourceType="epl_view" city="Baltimore" referenceType="epl" referenceId="landing" />
      <section className="ev-public-section py-8">
        <Badge>EPL</Badge>
        <h1 className="ev-title max-w-5xl">Remote-first city league operations.</h1>
        <p className="ev-subtitle max-w-3xl">
          EPL runs teams, standings, schedule, and registration without depending on physical infrastructure.
        </p>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="supporters" mode="compact" />

      <section className="ev-public-section pb-8">
        <EngagementLoopPanel
          contextLabel="Game-week loop"
          title="Follow a city. Build supporter status. Come back for movement."
          body="EPL now contributes to supporter progression through follows, game-week returns, and club loyalty instead of sitting as a disconnected content lane."
          actionHref="/enter"
          actionLabel="Open member lane"
        />
      </section>

      <ProductTrustGrid
        title="EPL is a real league system, not a side project."
        subtitle="The public surface keeps teams, schedule, standings, and supporter movement understandable even before full league density is in place."
        proofTitle="Proof"
        proof={[
          { title: "Real league structure", body: "Teams, schedule, standings, and opportunities are all separately routed." },
          { title: "Supporter progression", body: "Follows and game-week returns feed the identity layer." },
          { title: "Operational seriousness", body: "The public lane makes the league feel active and coherent." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "Clearer league story", body: "Visitors immediately understand what EPL is and where to go next." },
          { title: "More return visits", body: "Schedule, standings, and team lanes give people a reason to come back." },
          { title: "Better sponsorship fit", body: "Sponsors can align to a real commercial sports-style surface." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Is EPL only for hardcore fans?", answer: "No. The public lane is built so casual visitors can understand it quickly." },
          { question: "What if the season is still growing?", answer: "The structure still works because the public pages stay organized and live." },
          { question: "Does it connect to other EVNTSZN products?", answer: "Yes. Sponsors, Pulse, and the city stack all tie in cleanly." },
        ]}
        links={[
          { href: "/epl/teams", label: "See teams" },
          { href: "/epl/schedule", label: "See schedule" },
          { href: "/sponsors", label: "See sponsors" },
        ]}
      />

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
