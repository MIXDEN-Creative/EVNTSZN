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
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/epl/admin/approvals" className="ev-button-secondary">Review approvals</a>
          <a href="/epl/admin/programs" className="ev-button-secondary">Open programs</a>
          <a href="/epl/admin/sponsors" className="ev-button-secondary">Open sponsors</a>
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
              ["Host upgrade leads", city.hostUpgradeCandidates],
              ["Signal members", city.signalMembers],
              ["Ambassadors", city.ambassadorMembers],
              ["Sponsor accounts", city.sponsorAccounts],
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
                      {operator.organizerClassification ? (
                        <div className="mt-2 text-sm text-white/55">{String(operator.organizerClassification).replace(/_/g, " ")}</div>
                      ) : null}
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Program readiness</div>
              <div className="mt-5 space-y-3">
                {(city.programMembers || []).length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">No Signal or Ambassador members are currently assigned to this city.</div>
                ) : (
                  city.programMembers.map((member: any) => (
                    <div key={member.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                        <span>{member.programKey}</span>
                        <span>{member.status}</span>
                        <span>{String(member.activationReadiness || "review_needed").replace(/_/g, " ")}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">{member.fullName || "Program member"}</div>
                      <div className="mt-2 text-sm text-white/55">
                        {String(member.activationState || "pending").replace(/_/g, " ")}
                        {member.assignedManagerUserId ? " · manager assigned" : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Sponsor relationships</div>
              <div className="mt-5 space-y-3">
                {(city.sponsorRelationships || []).length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">No city-linked sponsor relationships are active yet.</div>
                ) : (
                  city.sponsorRelationships.map((account: any) => (
                    <div key={account.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                        <span>{account.scopeType}</span>
                        <span>{account.status}</span>
                        <span>{String(account.activationStatus || "prospect").replace(/_/g, " ")}</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">{account.name || "Sponsor account"}</div>
                      <div className="mt-2 text-sm text-white/55">
                        {String(account.fulfillmentStatus || "not_started").replace(/_/g, " ")}
                        {account.eplCategory ? ` · ${String(account.eplCategory).replace(/_/g, " ")}` : ""}
                        {account.assetReady ? " · assets ready" : ""}
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
