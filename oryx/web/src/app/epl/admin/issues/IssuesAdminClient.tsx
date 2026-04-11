"use client";

import { useEffect, useMemo, useState } from "react";

type SystemIssue = {
  id: string;
  source: string;
  severity: string;
  status: string;
  message: string;
  occurred_at?: string | null;
  context?: Record<string, unknown> | null;
};

export default function IssuesAdminClient() {
  const [issues, setIssues] = useState<SystemIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "monitoring" | "resolved" | "archived">("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/system-issues", { cache: "no-store" });
    const json = (await res.json()) as { issues?: SystemIssue[]; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load system issues.");
      return;
    }
    const nextIssues = json.issues || [];
    setIssues(nextIssues);
    setSelectedIssueId((current) => current || nextIssues[0]?.id || null);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return [issue.source, issue.severity, issue.status, issue.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [issues, query, statusFilter]);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId) || filteredIssues[0] || null,
    [filteredIssues, issues, selectedIssueId],
  );

  const summary = useMemo(
    () => ({
      open: issues.filter((issue) => issue.status === "open").length,
      monitoring: issues.filter((issue) => issue.status === "monitoring").length,
      resolved: issues.filter((issue) => issue.status === "resolved").length,
      critical: issues.filter((issue) => issue.severity === "critical").length,
    }),
    [issues],
  );

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    setMessage(null);
    const res = await fetch("/api/admin/system-issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingId(null);
    if (!res.ok) {
      setMessage(json.error || "Could not update system issue.");
      return;
    }
    setMessage(`Issue moved to ${status}.`);
    await load();
  }

  return (
    <main className="mx-auto max-w-[1500px]">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Issues & health</div>
            <h1 className="ev-title">Track platform problems, isolate the signal, and move incidents forward.</h1>
            <p className="ev-subtitle">
              Use this desk for platform failures, webhook problems, store issues, and operational health. Customer requests stay in Support.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Open", summary.open],
              ["Monitoring", summary.monitoring],
              ["Resolved", summary.resolved],
              ["Critical", summary.critical],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-meta-card">
                <div className="ev-meta-label">{label}</div>
                <div className="ev-meta-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="ev-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="ev-section-kicker">Issue queue</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Review the live incident list</h2>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Filter by current state, open the issue you need, then move it to monitoring, resolved, or archived from the detail panel.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              className="ev-field"
              placeholder="Search source, severity, or message"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="ev-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All issue states</option>
              <option value="open">Open</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="mt-5 space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
                No issues match the current filters.
              </div>
            ) : null}
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedIssueId(issue.id)}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  issue.id === selectedIssue?.id
                    ? "border-[#A259FF]/45 bg-[#A259FF]/10"
                    : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-[#caa7ff]">
                  <span>{issue.source}</span>
                  <span>{issue.severity}</span>
                  <span>{issue.status}</span>
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{issue.message}</div>
                {issue.occurred_at ? (
                  <div className="mt-2 text-sm text-white/55">{new Date(issue.occurred_at).toLocaleString()}</div>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Issue detail</div>
            {!selectedIssue ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-5 text-white/60">
                Select an issue from the queue to review source details and take action.
              </div>
            ) : (
              <>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedIssue.message}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="ev-chip ev-chip--external">{selectedIssue.source}</span>
                      <span className="ev-chip ev-chip--external">{selectedIssue.severity}</span>
                      <span className="ev-chip ev-chip--external">{selectedIssue.status}</span>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-white/65">
                    <div>
                      <span className="text-white/40">Occurred:</span>{" "}
                      {selectedIssue.occurred_at ? new Date(selectedIssue.occurred_at).toLocaleString() : "Not captured"}
                    </div>
                    <div>
                      <span className="text-white/40">Action path:</span> Review context, move to monitoring, then resolve or archive.
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <button
                    className="ev-button-secondary"
                    disabled={savingId === selectedIssue.id}
                    onClick={() => updateStatus(selectedIssue.id, "monitoring")}
                  >
                    {savingId === selectedIssue.id ? "Saving..." : "Mark monitoring"}
                  </button>
                  <button
                    className="ev-button-primary"
                    disabled={savingId === selectedIssue.id}
                    onClick={() => updateStatus(selectedIssue.id, "resolved")}
                  >
                    {savingId === selectedIssue.id ? "Saving..." : "Resolve issue"}
                  </button>
                  <button
                    className="ev-button-secondary"
                    disabled={savingId === selectedIssue.id}
                    onClick={() => updateStatus(selectedIssue.id, "archived")}
                  >
                    {savingId === selectedIssue.id ? "Saving..." : "Archive"}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Context</div>
            <h3 className="mt-3 text-xl font-bold text-white">Payload and system detail</h3>
            <p className="mt-2 text-sm text-white/60">
              Use the context payload to see the failing route, provider, event, or request details before you move the issue forward.
            </p>
            {selectedIssue?.context && Object.keys(selectedIssue.context).length ? (
              <pre className="mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-black/40 p-5 text-xs leading-6 text-white/68">
                {JSON.stringify(selectedIssue.context, null, 2)}
              </pre>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5 text-white/58">
                No structured context was stored for this issue.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
