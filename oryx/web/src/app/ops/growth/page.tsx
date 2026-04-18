import Link from "next/link";
import { redirect } from "next/navigation";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { formatUsd } from "@/lib/money";
import { getOperatorMonetizationWorkspace } from "@/lib/evntszn-monetization";

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export default async function OpsGrowthPage() {
  await requirePlatformUser("/ops/growth");
  const viewer = await getPlatformViewer();

  if (!viewer.user) {
    redirect("/account/login?next=/ops/growth");
  }

  if (!viewer.isPlatformAdmin && !viewer.operatorProfile?.is_active) {
    redirect("/account");
  }

  const workspace = await getOperatorMonetizationWorkspace(viewer.user.id);

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Growth earnings"
      title="Managed accounts, recurring earnings, and revenue activity"
      description="This workspace stays scoped to the signed-in operator account. Compensation only accrues while the managed account attribution stays active."
      actions={
        <>
          <Link href="/ops" className="ev-button-secondary">
            Back to ops
          </Link>
          <Link href="/ops/messages" className="ev-button-secondary">
            Internal messaging
          </Link>
        </>
      }
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Active accounts</div>
            <div className="ev-meta-value">{workspace.summary.activeAccountCount}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Pending earnings</div>
            <div className="ev-meta-value">{formatUsd(workspace.earnings.totalPendingUsd)}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Lifetime tracked</div>
            <div className="ev-meta-value">{formatUsd(workspace.earnings.totalLifetimeUsd)}</div>
          </div>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">My accounts</div>
          <div className="mt-5 space-y-3">
            {workspace.managedAccounts.length ? workspace.managedAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{account.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                      {labelize(account.sourceType)}{account.city ? ` · ${account.city}` : ""}{account.planLabel ? ` · ${account.planLabel}` : ""}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/68">
                    {account.activeStatus}
                  </div>
                </div>
                <div className="mt-3 text-sm text-white/62">
                  Started {new Date(account.attributionStartedAt).toLocaleDateString()}
                  {account.attributionEndedAt ? ` · ended ${new Date(account.attributionEndedAt).toLocaleDateString()}` : ""}
                </div>
                {account.notes ? <div className="mt-2 text-sm text-white/56">{account.notes}</div> : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                No managed accounts are currently attributed to this login.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Compensation plans</div>
            <div className="mt-5 space-y-3">
              {workspace.planAssignments.length ? workspace.planAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold text-white">{assignment.plan?.label || "Unassigned plan"}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                    {assignment.plan?.slug || "none"}{assignment.isPrimary ? " · primary" : ""}
                  </div>
                  <div className="mt-3 text-sm text-white/62">
                    Active from {new Date(assignment.effectiveStartsAt).toLocaleDateString()}
                    {assignment.effectiveEndsAt ? ` to ${new Date(assignment.effectiveEndsAt).toLocaleDateString()}` : ""}
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                  No active compensation plan assignment is attached to this user yet.
                </div>
              )}
            </div>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Earnings by category</div>
            <div className="mt-5 space-y-3">
              {workspace.earnings.byCategory.length ? workspace.earnings.byCategory.map((entry) => (
                <div key={entry.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/72">
                  <span>{labelize(entry.key)}</span>
                  <span className="font-semibold text-white">{formatUsd(entry.amount)}</span>
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                  No commission events have been derived for this user yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Recent activity</div>
          <div className="mt-5 space-y-3">
            {workspace.recentRevenueEvents.length ? workspace.recentRevenueEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{event.label || event.sourceId}</div>
                  <div className="text-sm text-white/72">{formatUsd(event.grossAmount)}</div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  {labelize(event.eventType)} · {labelize(event.sourceType)} · qty {event.quantity}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                No recent revenue events are attached to your managed accounts yet.
              </div>
            )}
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Recent earnings</div>
          <div className="mt-5 space-y-3">
            {workspace.recentCommissionEvents.length ? workspace.recentCommissionEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{event.label || event.sourceId}</div>
                  <div className="text-sm text-white">{formatUsd(event.amount)}</div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  {event.planSlug || "default"} · {event.ruleKey || "manual"} · {event.status}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                No commission events are available yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </SurfaceShell>
  );
}
