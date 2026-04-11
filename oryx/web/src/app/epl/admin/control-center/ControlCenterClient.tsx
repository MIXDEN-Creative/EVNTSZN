"use client";

import { useEffect, useState } from "react";

type QuickTask = {
  label: string;
  value: number;
  note: string;
  href: string;
  action: string;
};

export default function ControlCenterClient() {
  const [data, setData] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/control-center", { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error || "Could not load command-center summary.");
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
  const supportCountsByType = data?.supportCountsByType || [];

  const todayQueue: QuickTask[] = [
    {
      label: "Support waiting",
      value: stats?.supportTicketsOpen ?? 0,
      note: "Work the live support queue first.",
      href: "/epl/admin/support",
      action: "Open support",
    },
    {
      label: "Approvals waiting",
      value: stats?.pendingApprovals ?? 0,
      note: "Review applications before intake stalls.",
      href: "/epl/admin/approvals",
      action: "Open approvals",
    },
    {
      label: "Program reviews",
      value: stats?.pendingProgramReviews ?? 0,
      note: "Move Signal and Ambassador applicants forward.",
      href: "/epl/admin/programs",
      action: "Open programs",
    },
    {
      label: "Open issues",
      value: stats?.openIssues ?? 0,
      note: "Check incidents affecting payments, store, or webhooks.",
      href: "/epl/admin/issues",
      action: "Open issues",
    },
  ];

  const statBlocks = [
    {
      title: "Audience and operations",
      items: [
        ["Users", stats?.totalUsers ?? "—"],
        ["Operator profiles", stats?.operatorProfiles ?? "—"],
        ["Public events", stats?.publicEvents ?? "—"],
        ["Check-ins logged", stats?.checkInTotal ?? "—"],
      ],
    },
    {
      title: "Revenue pulse",
      items: [
        ["Ticket revenue", stats ? `$${((stats.ticketRevenueCents || 0) / 100).toLocaleString()}` : "—"],
        ["Sponsor revenue", stats ? `$${((stats.sponsorRevenueCents || 0) / 100).toLocaleString()}` : "—"],
        ["Package orders", stats?.sponsorPackageOrders ?? "—"],
        ["Sponsor accounts", stats?.sponsorAccounts ?? "—"],
      ],
    },
    {
      title: "Team and staffing",
      items: [
        ["Program members", stats?.programMembers ?? "—"],
        ["Active hosts", stats?.activeHosts ?? "—"],
        ["Independent organizers", stats?.independentOrganizers ?? "—"],
        ["Scanner-capable users", stats?.scannerCapableOperators ?? "—"],
      ],
    },
    {
      title: "Risk and reliability",
      items: [
        ["Open issues", stats?.openIssues ?? "—"],
        ["Store failures", stats?.storeFailureCount ?? "—"],
        ["Webhook failures", stats?.webhookFailureCount ?? "—"],
        ["Escalated support", stats?.supportTicketsEscalated ?? "—"],
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-[1500px]">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Control Center</div>
            <h1 className="ev-title">Run the day from one organized operating view.</h1>
            <p className="ev-subtitle">
              Start with the queues that block the day, then move into revenue, staffing, support, scanner coverage, and system health without hunting across desks.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="/epl/admin/approvals" className="ev-meta-card">
              <div className="ev-meta-label">Primary queue</div>
              <div className="ev-meta-value">Approvals, staffing intake, and player review</div>
            </a>
            <a href="/epl/admin/discovery" className="ev-meta-card">
              <div className="ev-meta-label">Discovery control</div>
              <div className="ev-meta-value">Homepage placement, public copy, and listing moderation</div>
            </a>
            <a href="/epl/admin/scanner" className="ev-meta-card">
              <div className="ev-meta-label">Scanner coverage</div>
              <div className="ev-meta-value">Gate access, event coverage, and live scanner launch</div>
            </a>
            <a href="/epl/admin/issues" className="ev-meta-card">
              <div className="ev-meta-label">Health desk</div>
              <div className="ev-meta-value">Operational incidents, failures, and system follow-up</div>
            </a>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>
      ) : null}

      {!data && !message ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`command-skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="mt-4 h-8 w-20 rounded bg-white/10" />
              <div className="mt-3 h-4 w-40 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : null}

      <section className="mt-8 ev-panel p-6">
        <div className="ev-section-kicker">Today</div>
        <h2 className="mt-3 text-2xl font-bold text-white">Start with the queues that can block daily operations.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {todayQueue.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</div>
              <div className="mt-3 text-3xl font-semibold text-white">{item.value}</div>
              <div className="mt-3 text-sm leading-6 text-white/60">{item.note}</div>
              <a href={item.href} className="ev-button-primary mt-5 inline-flex">
                {item.action}
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-4">
        {statBlocks.map((block) => (
          <section key={block.title} className="ev-panel p-6">
            <div className="ev-section-kicker">{block.title}</div>
            <div className="mt-5 space-y-3">
              {block.items.map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="ev-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Revenue and placement</div>
              <h2 className="mt-3 text-2xl font-bold text-white">See which cities and events are actually carrying revenue.</h2>
            </div>
            <a href="/epl/admin/payouts" className="ev-button-secondary">Open payouts</a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Revenue by city</div>
              <div className="mt-4 space-y-3">
                {cityRevenue.length === 0 ? (
                  <div className="text-sm text-white/60">City revenue will appear here as paid ticket orders land.</div>
                ) : (
                  cityRevenue.map((row: any) => (
                    <div key={row.city} className="flex items-center justify-between gap-3 text-sm text-white/70">
                      <span>{row.city}</span>
                      <span className="font-semibold text-white">${((row.cents || 0) / 100).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Top revenue events</div>
              <div className="mt-4 space-y-3">
                {topEvents.length === 0 ? (
                  <div className="text-sm text-white/60">Event revenue appears here when paid orders link back to public events.</div>
                ) : (
                  topEvents.map((row: any) => (
                    <div key={row.title} className="flex items-center justify-between gap-3 text-sm text-white/70">
                      <span>{row.title}</span>
                      <span className="font-semibold text-white">${((row.cents || 0) / 100).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Staffing and intake</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Keep hiring, opportunities, and programs moving.</h2>
            </div>
            <a href="/epl/admin/opportunities" className="ev-button-secondary">Open staffing</a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Opportunity mix</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <div className="flex items-center justify-between gap-3"><span>Total</span><span className="font-semibold text-white">{opportunityCounts?.total ?? 0}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Open</span><span className="font-semibold text-white">{opportunityCounts?.open ?? 0}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Public</span><span className="font-semibold text-white">{opportunityCounts?.public ?? 0}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Paid</span><span className="font-semibold text-white">{opportunityCounts?.paid ?? 0}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Volunteer</span><span className="font-semibold text-white">{opportunityCounts?.volunteer ?? 0}</span></div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Hiring funnel</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
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
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Signal & Ambassador</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
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
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">City readiness</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                {cityReadinessCounts.length === 0 ? (
                  <div>No city-readiness signals yet.</div>
                ) : (
                  cityReadinessCounts.slice(0, 6).map((row: any) => (
                    <div key={row.city} className="flex items-center justify-between gap-3">
                      <span>{row.city}</span>
                      <span className="font-semibold text-white">{row.hosts} hosts · {row.programs} ready</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Support and issues</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Separate customer workload from system incidents.</h2>
            </div>
            <div className="flex gap-3">
              <a href="/epl/admin/support" className="ev-button-secondary">Open support</a>
              <a href="/epl/admin/issues" className="ev-button-secondary">Open issues</a>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Issue sources</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                {issueCountsBySource.length === 0 ? <div>No issue sources logged yet.</div> : issueCountsBySource.map((row: any) => (
                  <div key={row.source} className="flex items-center justify-between gap-3"><span>{row.source}</span><span className="font-semibold text-white">{row.count}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Issue severity</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                {issueCountsBySeverity.length === 0 ? <div>No severity data logged yet.</div> : issueCountsBySeverity.map((row: any) => (
                  <div key={row.severity} className="flex items-center justify-between gap-3"><span>{row.severity}</span><span className="font-semibold text-white">{row.count}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <div className="text-sm font-semibold text-white">Support by type</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                {supportCountsByType.length === 0 ? <div>No support tickets logged yet.</div> : supportCountsByType.map((row: any) => (
                  <div key={row.type} className="flex items-center justify-between gap-3"><span>{String(row.type).replace(/_/g, " ")}</span><span className="font-semibold text-white">{row.count}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Recent issue visibility</div>
              <h2 className="mt-3 text-2xl font-bold text-white">See the latest operational incidents without leaving the desk.</h2>
            </div>
            <a href="/epl/admin/issues" className="ev-button-secondary">Open issues desk</a>
          </div>
          <div className="mt-6 space-y-3">
            {issues.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-white/60">No system issues have been logged into the dashboard yet.</div>
            ) : (
              issues.map((issue: any) => (
                <article key={issue.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
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
