"use client";

import { useEffect, useState } from "react";
import PlatformCapacityMonitor from "@/components/admin/PlatformCapacityMonitor";
import PerformanceScorePanel from "@/components/performance/PerformanceScorePanel";
import { formatUsd } from "@/lib/money";

type QuickTask = {
  label: string;
  value: number;
  note: string;
  href: string;
  action: string;
};

export default function ControlCenterClient({ isFounder }: { isFounder?: boolean }) {
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
        ["Ticket revenue", stats ? formatUsd(stats.ticketRevenueUsd || 0) : "—"],
        ["Sponsor revenue", stats ? formatUsd(stats.sponsorRevenueUsd || 0) : "—"],
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
    <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
      {isFounder && (
        <div className="mt-8">
          <PlatformCapacityMonitor />
        </div>
      )}
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid lg:grid-cols-[1.2fr_0.8fr] 2xl:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="ev-kicker">Control Center</div>
            <h1 className="ev-title">Run the day from one organized operating view.</h1>
            <p className="ev-subtitle">
              Start with the queues that can block the day, then move into revenue, staffing, support, scanner coverage, and system health without hunting across desks.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <a href="/epl/admin/approvals" className="ev-meta-card hover:border-white/20 transition-all">
              <div className="ev-meta-label">Primary queue</div>
              <div className="ev-meta-value font-medium text-white/90">Approvals, staffing intake, and player review</div>
            </a>
            <a href="/epl/admin/discovery" className="ev-meta-card hover:border-white/20 transition-all">
              <div className="ev-meta-label">Discovery control</div>
              <div className="ev-meta-value font-medium text-white/90">Homepage placement, public copy, and listing moderation</div>
            </a>
            <a href="/epl/admin/scanner" className="ev-meta-card hover:border-white/20 transition-all">
              <div className="ev-meta-label">Scanner coverage</div>
              <div className="ev-meta-value font-medium text-white/90">Gate access, event coverage, and live scanner launch</div>
            </a>
            <a href="/epl/admin/issues" className="ev-meta-card hover:border-white/20 transition-all">
              <div className="ev-meta-label">Health desk</div>
              <div className="ev-meta-value font-medium text-white/90">Operational incidents, failures, and system follow-up</div>
            </a>
          </div>
        </div>
      </section>

      <div className="mt-8">
        <PerformanceScorePanel scope="founder" title="PPS" />
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>
      ) : null}

      {!data && !message ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`command-skeleton-${index}`} className="animate-pulse rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="mt-4 h-10 w-20 rounded bg-white/10" />
              <div className="mt-4 h-4 w-full rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : null}

      <section className="mt-12 ev-panel p-8 md:p-10">
        <div className="ev-section-kicker">Today</div>
        <h2 className="mt-3 text-3xl font-bold text-white tracking-tight">Start with the queues that can block daily operations.</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {todayQueue.map((item) => (
            <div key={item.label} className="flex flex-col rounded-[32px] border border-white/10 bg-white/[0.02] p-7 transition-all hover:bg-white/[0.04]">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">{item.label}</div>
              <div className="mt-4 text-4xl font-black text-white">{item.value}</div>
              <div className="mt-4 flex-1 text-sm leading-relaxed text-white/60">{item.note}</div>
              <a href={item.href} className="mt-8 rounded-full bg-white px-6 py-3.5 text-center text-[11px] font-black uppercase tracking-widest text-black transition hover:opacity-90">
                {item.action}
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statBlocks.map((block) => (
          <section key={block.title} className="ev-panel p-8">
            <div className="ev-section-kicker">{block.title}</div>
            <div className="mt-6 space-y-4">
              {block.items.map(([label, value]) => (
                <div key={String(label)} className="rounded-[24px] border border-white/5 bg-white/[0.01] p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight">{value}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="ev-panel p-8 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="ev-section-kicker">Revenue and placement</div>
              <h2 className="mt-3 text-2xl font-bold text-white tracking-tight">See which cities and events are actually carrying revenue.</h2>
            </div>
            <a href="/epl/admin/payouts" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 whitespace-nowrap">Open payouts</a>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Revenue by city</div>
              <div className="mt-6 space-y-4">
                {cityRevenue.length === 0 ? (
                  <div className="text-sm text-white/40 italic">City revenue will appear here as paid ticket orders land.</div>
                ) : (
                  cityRevenue.map((row: any) => (
                    <div key={row.city} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/60">{row.city}</span>
                      <span className="text-sm font-bold text-white">{formatUsd(row.revenueUsd || 0)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Top revenue events</div>
              <div className="mt-6 space-y-4">
                {topEvents.length === 0 ? (
                  <div className="text-sm text-white/40 italic">Event revenue appears here when paid orders link back to public events.</div>
                ) : (
                  topEvents.map((row: any) => (
                    <div key={row.title} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/60 truncate max-w-[140px]">{row.title}</span>
                      <span className="text-sm font-bold text-white">{formatUsd(row.revenueUsd || 0)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-8 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="ev-section-kicker">Staffing and intake</div>
              <h2 className="mt-3 text-2xl font-bold text-white tracking-tight">Keep hiring, opportunities, and programs moving.</h2>
            </div>
            <a href="/epl/admin/opportunities" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 whitespace-nowrap">Open staffing</a>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Opportunity mix</div>
              <div className="mt-6 space-y-4">
                {[
                  ["Total", opportunityCounts?.total ?? 0],
                  ["Open", opportunityCounts?.open ?? 0],
                  ["Public", opportunityCounts?.public ?? 0],
                  ["Paid", opportunityCounts?.paid ?? 0],
                  ["Volunteer", opportunityCounts?.volunteer ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-white/60">{label}</span>
                    <span className="text-sm font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Hiring funnel</div>
              <div className="mt-6 space-y-4">
                {hiringStageCounts.length === 0 ? (
                  <div className="text-sm text-white/40 italic">No staffing applications have landed yet.</div>
                ) : (
                  hiringStageCounts.map((row: any) => (
                    <div key={row.status} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-white/60">{row.status}</span>
                      <span className="text-sm font-bold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Signal & Ambassador</div>
              <div className="mt-6 space-y-4">
                {programCounts.length === 0 ? (
                  <div className="text-sm text-white/40 italic">No program-member pipeline data yet.</div>
                ) : (
                  programCounts.map((row: any) => (
                    <div key={row.key} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-white/60 capitalize">{String(row.key).replace(":", " · ")}</span>
                      <span className="text-sm font-bold text-white">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">City readiness</div>
              <div className="mt-6 space-y-4">
                {cityReadinessCounts.length === 0 ? (
                  <div className="text-sm text-white/40 italic">No city-readiness signals yet.</div>
                ) : (
                  cityReadinessCounts.slice(0, 6).map((row: any) => (
                    <div key={row.city} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-white/60">{row.city}</span>
                      <span className="text-sm font-bold text-white">{row.hosts} hosts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-8 md:p-10 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="ev-section-kicker">Support and issues</div>
              <h2 className="mt-3 text-2xl font-bold text-white tracking-tight">Separate customer workload from system incidents.</h2>
            </div>
            <div className="flex gap-3">
              <a href="/epl/admin/support" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 whitespace-nowrap">Open support</a>
              <a href="/epl/admin/issues" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 whitespace-nowrap">Open issues</a>
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Issue sources</div>
              <div className="mt-6 space-y-4">
                {issueCountsBySource.length === 0 ? <div>No issue sources logged yet.</div> : issueCountsBySource.map((row: any) => (
                  <div key={row.source} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-white/60">{row.source}</span>
                    <span className="text-sm font-bold text-white">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Issue severity</div>
              <div className="mt-6 space-y-4">
                {issueCountsBySeverity.length === 0 ? <div>No severity data logged yet.</div> : issueCountsBySeverity.map((row: any) => (
                  <div key={row.severity} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-white/60">{row.severity}</span>
                    <span className="text-sm font-bold text-white">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-7">
              <div className="text-sm font-bold text-white/90 uppercase tracking-widest">Support by type</div>
              <div className="mt-6 space-y-4">
                {supportCountsByType.length === 0 ? <div>No support tickets logged yet.</div> : supportCountsByType.map((row: any) => (
                  <div key={row.type} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-white/60 capitalize">{String(row.type).replace(/_/g, " ")}</span>
                    <span className="text-sm font-bold text-white">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-12 ev-panel p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <div className="ev-section-kicker">Recent issue visibility</div>
            <h2 className="mt-3 text-3xl font-bold text-white tracking-tight">See the latest operational incidents without leaving the desk.</h2>
          </div>
          <a href="/epl/admin/issues" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 whitespace-nowrap">Open issues desk</a>
        </div>
        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          {issues.length === 0 ? (
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8 text-white/40 italic lg:col-span-2">No system issues have been logged into the dashboard yet.</div>
          ) : (
            issues.map((issue: any) => (
              <article key={issue.id} className="rounded-[32px] border border-white/10 bg-white/[0.02] p-7 transition-all hover:bg-white/[0.04]">
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">
                  <span className="px-2 py-1 rounded bg-[#caa7ff]/10">{issue.source}</span>
                  <span className="px-2 py-1 rounded bg-white/5">{issue.severity}</span>
                  <span className="px-2 py-1 rounded bg-white/5">{issue.status}</span>
                </div>
                <div className="mt-5 text-lg font-bold text-white/90 leading-tight">{issue.message}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
