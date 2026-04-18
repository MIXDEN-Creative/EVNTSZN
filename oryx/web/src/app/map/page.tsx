import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import { getMapZones } from "@/lib/evntszn-phase";

export default async function MapPage() {
  const zones = await getMapZones();

  return (
    <main className="ev-public-page">
      <PulseActivityBeacon sourceType="discover_view" city="Baltimore" referenceType="discover" referenceId="map" />
      <section className="ev-public-section py-8">
        <Badge>Discover Map</Badge>
        <h1 className="ev-title max-w-5xl">City zones, not dead pins.</h1>
        <p className="ev-subtitle max-w-3xl">
          EVNTSZN map mode stays alive with hot, rising, active, and low zones so the city still feels operable with minimal supply.
        </p>
      </section>

      <section className="ev-public-section pb-14">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id} className="overflow-hidden">
              <div className={`h-2 rounded-full ${
                zone.state === "hot"
                  ? "bg-red-400"
                  : zone.state === "rising"
                    ? "bg-amber-300"
                    : zone.state === "active"
                      ? "bg-emerald-400"
                      : "bg-white/25"
              }`} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{zone.city}</div>
                  <CardTitle className="mt-2">{zone.label}</CardTitle>
                </div>
                <Badge>{zone.state}</Badge>
              </div>
              <div className="mt-6 text-5xl font-black tracking-tight text-white">{zone.pulse}</div>
              <CardDescription className="mt-2">{zone.nowLabel}</CardDescription>
              {zone.tonightLabel ? (
                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                  {zone.tonightLabel}
                </div>
              ) : null}
              <p className="mt-6 text-sm leading-6 text-white/62">{zone.detail}</p>
              {zone.momentumLabel ? <p className="mt-3 text-sm leading-6 text-white/52">{zone.momentumLabel}</p> : null}
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
