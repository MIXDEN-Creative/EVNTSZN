"use client";

import { useEffect, useState } from "react";

export default function ControlCenterClient() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/control-center", { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as { error?: string; stats?: Record<string, unknown>; issues?: unknown[] };
        if (!res.ok) {
          throw new Error(json.error || "Could not load command-center summary.");
        }
        setData(json);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const stats = data?.stats;
  const issues = data?.issues || [];
  const cityRevenue = data?.cityRevenue || [];
  const topEvents = data?.topEvents || [];
  const issueCountsBySource = data?.issueCountsBySource || [];
  const issueCountsBySeverity = data?.issueCountsBySeverity || [];
  const sponsorAccountCounts = data?.sponsorAccountCounts || [];
  const programCounts = data?.programCounts || [];
  const hiringStageCounts = data?.hiringStageCounts || [];
  const opportunityCounts = data?.opportunityCounts || null;
  const hostOrganizerMix = data?.hostOrganizerMix || { hosts: 0, independentOrganizers: 0 };
  const cityReadinessCounts = data?.cityReadinessCounts || [];

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Control center</div>
            <h1 className="ev-title">Run EVNTSZN from one executive command layer.</h1>
            <p className="ev-subtitle">
              Monitor users, approvals, discovery inventory, sponsorship money, and operational issues without leaving the dashboard.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Users", stats?.totalUsers ?? "—"],
          ["Pending approvals", stats?.pendingApprovals ?? "—"],
          ["Public events", stats?.publicEvents ?? "—"],
          ["Open issues", stats?.openIssues ?? "—"],
          ["Ticket revenue", stats ? `$${((stats.ticketRevenueCents || 0) / 100).toLocaleString()}` : "—"],
          ["Sponsor revenue", stats ? `$${((stats.sponsorRevenueCents || 0) / 100).toLocaleString()}` : "—"],
          ["Package orders", stats?.sponsorPackageOrders ?? "—"],
          ["Sponsor accounts", stats?.sponsorAccounts ?? "—"],
          ["Sponsor prospects", stats?.sponsorProspects ?? "—"],
          ["Active sponsors", stats?.activeSponsors ?? "—"],
          ["Program members", stats?.programMembers ?? "—"],
          ["Pending program reviews", stats?.pendingProgramReviews ?? "—"],
          ["Operator profiles", stats?.operatorProfiles ?? "—"],
          ["Active hosts", stats?.activeHosts ?? "—"],
          ["Independent organizers", stats?.independentOrganizers ?? "—"],
          ["Check-ins logged", stats?.checkInTotal ?? "—"],
          ["Scanner-capable users", stats?.scannerCapableOperators ?? "—"],
          ["Active scan assignments", stats?.activeScanAssignments ?? "—"],
          ["Store failures", stats?.storeFailureCount ?? "—"],
          ["Webhook failures", stats?.webhookFailureCount ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="ev-stat">
            <div className="ev-stat-label">{label}</div>
            <div className="ev-stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Revenue by city</div>
          <div className="mt-5 space-y-3">
            {cityRevenue.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                City revenue will appear here as paid ticket orders land.
              </div>
            ) : (
              cityRevenue.map((row: any) => (
                <div key={row.city} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white">{row.city}</div>
                  <div className="mt-2 text-sm text-white/60">${((row.cents || 0) / 100).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Top revenue events</div>
          <div className="mt-5 space-y-3">
            {topEvents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                Event-level revenue will appear here when paid orders are linked to public events.
              </div>
            ) : (
              topEvents.map((row: any) => (
                <div key={row.title} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white">{row.title}</div>
                  <div className="mt-2 text-sm text-white/60">${((row.cents || 0) / 100).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Hiring and opportunities</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Opportunity mix</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                <div>Total: {opportunityCounts?.total ?? 0}</div>
                <div>Open: {opportunityCounts?.open ?? 0}</div>
                <div>Public: {opportunityCounts?.public ?? 0}</div>
                <div>Paid: {opportunityCounts?.paid ?? 0}</div>
                <div>Volunteer: {opportunityCounts?.volunteer ?? 0}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Hiring funnel</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {hiringStageCounts.length === 0 ? (
                  <div>No staffing applications have landed yet.</div>
                ) : (
                  hiringStageCounts.map((row: any) => (
                    <div key={row.status} className="flex items-center justify-between gap-3">
                      <span>{row.status}</span>
                      <span className="font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Sponsors and programs</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Sponsor accounts</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {sponsorAccountCounts.length === 0 ? (
                  <div>No sponsor-account lifecycle data yet.</div>
                ) : (
                  sponsorAccountCounts.map((row: any) => (
                    <div key={row.status} className="flex items-center justify-between gap-3">
                      <span>{String(row.status).replace(":", " · ")}</span>
                      <span className="font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Signal & Ambassador</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {programCounts.length === 0 ? (
                  <div>No program-member pipeline data yet.</div>
                ) : (
                  programCounts.map((row: any) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                      <span>{String(row.key).replace(":", " · ")}</span>
                      <span className="font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Issue distribution</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">By source</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {issueCountsBySource.length === 0 ? (
                  <div>No issue sources logged yet.</div>
                ) : (
                  issueCountsBySource.map((row: any) => (
                    <div key={row.source} className="flex items-center justify-between gap-3">
                      <span>{row.source}</span>
                      <span className="font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">By severity</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {issueCountsBySeverity.length === 0 ? (
                  <div>No severity data logged yet.</div>
                ) : (
                  issueCountsBySeverity.map((row: any) => (
                    <div key={row.severity} className="flex items-center justify-between gap-3">
                      <span>{row.severity}</span>
                      <span className="font-semibold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Readiness mix</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Host vs organizer mix</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                <div className="flex items-center justify-between gap-3">
                  <span>Network-aligned hosts</span>
                  <span className="font-semibold text-white">{hostOrganizerMix.hosts ?? 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Independent organizers</span>
                  <span className="font-semibold text-white">{hostOrganizerMix.independentOrganizers ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">City readiness</div>
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {cityReadinessCounts.length === 0 ? (
                  <div>No city-readiness signals yet.</div>
                ) : (
                  cityReadinessCounts.slice(0, 6).map((row: any) => (
                    <div key={row.city} className="flex items-center justify-between gap-3">
                      <span>{row.city}</span>
                      <span className="font-semibold text-white">{row.hosts} hosts · {row.programs} ready programs</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Issue visibility</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Recent operational issues</h2>
          <div className="mt-5 space-y-3">
            {issues.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
                No system issues have been logged into the dashboard yet.
              </div>
            ) : (
              issues.map((issue: any) => (
                <article key={issue.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#c5a2ff]">
                    <span>{issue.source}</span>
                    <span>{issue.severity}</span>
                    <span>{issue.status}</span>
                  </div>
                  <div className="mt-3 text-base font-semibold text-white">{issue.message}</div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
