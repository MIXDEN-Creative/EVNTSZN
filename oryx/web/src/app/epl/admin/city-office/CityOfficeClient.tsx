"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS, getCityStateCode } from "@/lib/city-options";

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
  const [offices, setOffices] = useState<any[]>([]);
  const [officeLeads, setOfficeLeads] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [message, setMessage] = useState("");
  const [officeForm, setOfficeForm] = useState({
    id: "",
    officeName: "",
    city: "Baltimore",
    state: "MD",
    region: "",
    officeStatus: "active",
    officeLeadUserId: "",
    notes: "",
    description: "",
  });

  useEffect(() => {
    fetch(apiPath, { cache: "no-store" })
      .then(async (res) => (await res.json()) as { cities?: any[]; offices?: any[]; officeLeads?: any[] })
      .then((json) => {
        const next = json.cities || [];
        setCities(next);
        setOffices(json.offices || []);
        setOfficeLeads(json.officeLeads || []);
        if (!selectedCity && next[0]?.city) setSelectedCity(next[0].city);
      });
  }, [apiPath, selectedCity]);

  const city = useMemo(
    () => cities.find((item) => item.city === selectedCity) || null,
    [cities, selectedCity],
  );
  const cityOffices = useMemo(() => offices.filter((item) => item.city === selectedCity), [offices, selectedCity]);

  async function saveOffice(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(officeForm),
    });
    const json = (await response.json()) as { error?: string; officeId?: string };
    if (!response.ok) {
      setMessage(json.error || "Could not save office.");
      return;
    }
    setMessage(officeForm.id ? "Office updated." : "Office created.");
    setOfficeForm({
      id: "",
      officeName: "",
      city: selectedCity || "Baltimore",
      state: getCityStateCode(selectedCity || "Baltimore") || "MD",
      region: "",
      officeStatus: "active",
      officeLeadUserId: "",
      notes: "",
      description: "",
    });
    const refresh = await fetch(apiPath, { cache: "no-store" });
    const payload = (await refresh.json()) as { cities?: any[]; offices?: any[]; officeLeads?: any[] };
    setCities(payload.cities || []);
    setOffices(payload.offices || []);
    setOfficeLeads(payload.officeLeads || []);
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="ev-kicker">Offices</div>
            <h1 className="text-3xl font-black text-white">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/62">{description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/68">{scopeNote}</div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <section className="mt-6 ev-panel p-6">
        <div className="grid gap-4 md:grid-cols-[280px_1fr_auto]">
          <select className="ev-field" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            {cities.map((item) => (
              <option key={item.city} value={item.city}>{item.city}</option>
            ))}
          </select>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/68">
            {city ? `${city.city} has ${cityOffices.length} office record${cityOffices.length === 1 ? "" : "s"} and ${city.pendingApprovals} pending approvals.` : scopeNote}
          </div>
          <button
            type="button"
            className="ev-button-primary"
            onClick={() =>
              setOfficeForm({
                id: "",
                officeName: "",
                city: selectedCity || "Baltimore",
                state: getCityStateCode(selectedCity || "Baltimore") || "MD",
                region: "",
                officeStatus: "active",
                officeLeadUserId: "",
                notes: "",
                description: "",
              })
            }
          >
            New office
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Current city</div>
            <div className="mt-2 font-semibold text-white">{selectedCity || "Select a city"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Office records</div>
            <div className="mt-2 font-semibold text-white">{cityOffices.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Assigned lead</div>
            <div className="mt-2 font-semibold text-white">
              {officeLeads.find((lead) => lead.userId === officeForm.officeLeadUserId)?.fullName || "Not assigned"}
            </div>
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

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Office records</div>
              <h2 className="mt-3 text-2xl font-bold text-white">{officeForm.id ? "Update office" : "Create office"}</h2>
              <p className="mt-2 text-sm text-white/60">
                Keep this scoped to the basics: location, status, lead assignment, description, and internal notes.
              </p>
              <form onSubmit={saveOffice} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="ev-field" placeholder="Office name" value={officeForm.officeName} onChange={(e) => setOfficeForm({ ...officeForm, officeName: e.target.value })} />
                  <select className="ev-field" value={officeForm.city} onChange={(e) => setOfficeForm({ ...officeForm, city: e.target.value, state: getCityStateCode(e.target.value) || officeForm.state })}>
                    {INTERNAL_CITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <input className="ev-field" placeholder="State" value={officeForm.state} onChange={(e) => setOfficeForm({ ...officeForm, state: e.target.value })} />
                  <input className="ev-field" placeholder="Region" value={officeForm.region} onChange={(e) => setOfficeForm({ ...officeForm, region: e.target.value })} />
                  <select className="ev-field" value={officeForm.officeStatus} onChange={(e) => setOfficeForm({ ...officeForm, officeStatus: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="launching">Launching</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <select className="ev-field" value={officeForm.officeLeadUserId} onChange={(e) => setOfficeForm({ ...officeForm, officeLeadUserId: e.target.value })}>
                  <option value="">No office lead assigned</option>
                  {officeLeads.map((lead) => (
                    <option key={lead.userId} value={lead.userId}>{lead.fullName || lead.userId}</option>
                  ))}
                </select>
                <textarea className="ev-textarea" rows={4} placeholder="Office description" value={officeForm.description} onChange={(e) => setOfficeForm({ ...officeForm, description: e.target.value })} />
                <textarea className="ev-textarea" rows={3} placeholder="Internal notes" value={officeForm.notes} onChange={(e) => setOfficeForm({ ...officeForm, notes: e.target.value })} />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="ev-button-primary">{officeForm.id ? "Save office" : "Create office"}</button>
                  {officeForm.id ? (
                    <button
                      type="button"
                      className="ev-button-secondary"
                      onClick={() =>
                        setOfficeForm({
                          id: "",
                          officeName: "",
                          city: selectedCity || "Baltimore",
                          state: getCityStateCode(selectedCity || "Baltimore") || "MD",
                          region: "",
                          officeStatus: "active",
                          officeLeadUserId: "",
                          notes: "",
                          description: "",
                        })
                      }
                    >
                      Clear selection
                    </button>
                  ) : null}
                </div>
              </form>
              <div className="mt-5 space-y-3">
                {cityOffices.length ? cityOffices.map((office) => (
                  <button
                    key={office.id}
                    type="button"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left"
                    onClick={() =>
                      setOfficeForm({
                        id: office.id,
                        officeName: office.officeName || "",
                        city: office.city || selectedCity,
                        state: office.state || "",
                        region: office.region || "",
                        officeStatus: office.officeStatus || "active",
                        officeLeadUserId: office.officeLeadUserId || "",
                        notes: office.notes || "",
                        description: office.description || "",
                      })
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">{office.officeName}</div>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#caa7ff]">{office.officeStatus}</span>
                    </div>
                    <div className="mt-2 text-sm text-white/58">{[office.city, office.state, office.region].filter(Boolean).join(" • ")}</div>
                    <div className="mt-1 text-xs text-white/45">{office.officeLeadName || "No office lead assigned"}</div>
                  </button>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/48">No offices created for this city yet.</div>
                )}
              </div>
            </section>

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
