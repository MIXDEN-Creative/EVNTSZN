"use client";

import { useEffect, useState } from "react";

export default function IssuesAdminClient() {
  const [issues, setIssues] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/system-issues", { cache: "no-store" });
    const json = (await res.json()) as { issues?: any[] };
    setIssues(json.issues || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/system-issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Issues & health</div>
            <h1 className="ev-title">Track operational failures without leaving the command layer.</h1>
            <p className="ev-subtitle">Webhook failures, store fetch issues, and system events can be monitored here and marked as monitoring or resolved.</p>
          </div>
        </div>
      </section>
      <div className="mt-6 space-y-4">
        {issues.map((issue) => (
          <article key={issue.id} className="ev-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{issue.source} • {issue.severity} • {issue.status}</div>
                <div className="mt-3 text-xl font-bold text-white">{issue.message}</div>
                {issue.occurred_at ? (
                  <div className="mt-2 text-sm text-white/55">
                    {new Date(issue.occurred_at).toLocaleString()}
                  </div>
                ) : null}
                {issue.context && Object.keys(issue.context).length ? (
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-white/60">
                    {JSON.stringify(issue.context, null, 2)}
                  </pre>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="ev-button-secondary text-sm" onClick={() => updateStatus(issue.id, "monitoring")}>Mark monitoring</button>
                <button className="ev-button-primary text-sm" onClick={() => updateStatus(issue.id, "resolved")}>Resolve</button>
                <button className="ev-button-secondary text-sm" onClick={() => updateStatus(issue.id, "archived")}>Archive</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
