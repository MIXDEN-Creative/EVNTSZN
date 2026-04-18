import { notFound } from "next/navigation";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getEplCitySnapshot } from "@/lib/evntszn-phase";

type RouteContext = {
  params: Promise<{ city: string }>;
};

export default async function EplCityPage({ params }: RouteContext) {
  const { city } = await params;
  const snapshot = await getEplCitySnapshot(city);
  if (!snapshot) notFound();

  return (
    <main className="ev-public-page">
      <PulseActivityBeacon sourceType="epl_view" city={snapshot.city.name} referenceType="epl_city" referenceId={snapshot.city.slug} />
      <section className="ev-public-section py-8">
        <Badge>{snapshot.city.name} EPL</Badge>
        <h1 className="ev-title max-w-5xl">{snapshot.city.name} league page.</h1>
        <p className="ev-subtitle max-w-3xl">
          Teams, standings, schedule, and registrations stay live even when the league is running remotely.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <SaveToggle
            item={{
              intent: "watch",
              entityType: "epl_city",
              entityKey: snapshot.city.slug,
              title: `${snapshot.city.name} EPL`,
              href: `/epl/${snapshot.city.slug}`,
              city: snapshot.city.name,
              state: snapshot.city.state,
            }}
            inactiveLabel="Watch this city"
            activeLabel="Watching city"
          />
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
            {snapshot.schedule.length ? `${snapshot.schedule.length} games this week` : "Teams forming"}
          </div>
        </div>
      </section>

      <section className="ev-public-section pb-14">
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="space-y-4 xl:col-span-1">
            <CardTitle>Teams</CardTitle>
            {snapshot.teams.slice(0, 8).map((team: any) => (
              <div key={team.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-black text-white">{team.team_name}</div>
                <div className="mt-1 text-sm text-white/58">{team.team_code || "EPL"} · {team.captain_name || "Captains TBD"}</div>
              </div>
            ))}
          </Card>

          <Card className="space-y-4 xl:col-span-1">
            <CardTitle>Standings</CardTitle>
            {snapshot.standings.map((team) => (
              <div key={team.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
                <div>
                  <div className="text-lg font-black text-white">{team.name}</div>
                  <CardDescription>{team.record}</CardDescription>
                </div>
                <div className="text-right text-sm text-white/65">
                  <div>PF {team.pointsFor}</div>
                  <div>PA {team.pointsAgainst}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card className="space-y-4 xl:col-span-1">
            <CardTitle>Schedule</CardTitle>
            {snapshot.schedule.map((game) => (
              <div key={`${game.home}-${game.away}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-black text-white">{game.home} vs {game.away}</div>
                <CardDescription className="mt-1">{game.when}</CardDescription>
              </div>
            ))}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              Registrations from {snapshot.city.name}: {snapshot.registrations.length}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
