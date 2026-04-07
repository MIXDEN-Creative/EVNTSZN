"use client";

import { useEffect, useMemo, useState } from "react";

export default function CityOfficeClient({
  apiPath = "/api/admin/city-office",
  title = "Run each market with a clean city-scoped operating view.",
  description = "Track event volume, revenue, approvals, host and organizer coverage, and the operator roster for each city without mixing markets together.",
  scopeNote = "Founder and HQ can review every market. City operators should be scoped to their assigned city set.",
}: {
  apiPath?: string;
  title?: string;
  description?: string;
  scopeNote?: string;
}) {
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    fetch(apiPath, { cache: "no-store" })
      .then(async (res) => (await res.json()) as { cities?: any[] })
      .then((json) => {
        const next = json.cities || [];
        setCities(next);
        if (!selectedCity && next[0]?.city) setSelectedCity(next[0].city);
      });
  }, [apiPath, selectedCity]);

  const city = useMemo(
    () => cities.find((item) => item.city === selectedCity) || null,
    [cities, selectedCity],
  );

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">City office</div>
            <h1 className="ev-title">{title}</h1>
            <p className="ev-subtitle">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 ev-panel p-6">
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <select className="ev-field" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            {cities.map((item) => (
              <option key={item.city} value={item.city}>{item.city}</option>
            ))}
          </select>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/68">
            {scopeNote}
          </div>
        </div>
      </section>

      {city ? (
        <>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total events", city.totalEvents],
              ["Published", city.publishedEvents],
              ["Upcoming", city.upcomingEvents],
              ["Pending approvals", city.pendingApprovals],
              ["Hosts", city.hosts],
              ["Organizers", city.organizers],
              ["Ticket revenue", `$${((city.paidRevenueCents || 0) / 100).toLocaleString()}`],
              ["Sponsor revenue", `$${((city.sponsorRevenueCents || 0) / 100).toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-stat">
                <div className="ev-stat-label">{label}</div>
                <div className="ev-stat-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Scoped operators</div>
              <div className="mt-5 space-y-3">
                {(city.operators || []).length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">No operator profiles assigned to this city scope yet.</div>
                ) : (
                  city.operators.map((operator: any) => (
                    <div key={`${city.city}-${operator.userId}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-sm font-semibold text-white">{operator.roleKey}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                        {operator.isActive ? "active" : "inactive"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Approval load</div>
              <div className="mt-5 space-y-3">
                {(city.applications || []).length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">No applications are currently tied to this city.</div>
                ) : (
                  city.applications.map((application: any) => (
                    <div key={application.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-sm font-semibold text-white">{application.type}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                        {application.status}{application.discoveryEligible ? " · discovery eligible" : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
