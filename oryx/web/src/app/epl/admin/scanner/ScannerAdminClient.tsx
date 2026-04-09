"use client";

import { useEffect, useState } from "react";

export default function ScannerAdminClient() {
  const [data, setData] = useState<{ operators: any[]; assignments: any[] }>({ operators: [], assignments: [] });
  const [message, setMessage] = useState("");

  async function load() {
    fetch("/api/admin/scanner-access", { cache: "no-store" })
      .then(async (res) => (await res.json()) as { operators?: any[]; assignments?: any[] })
      .then((json) => setData({ operators: json.operators || [], assignments: json.assignments || [] }));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateScannerAccess(userId: string, canAccessScanner: boolean) {
    await fetch("/api/admin/scanner-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, canAccessScanner }),
    });
    setMessage("Scanner access updated.");
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Scanner control</div>
            <h1 className="ev-title">See who can work the gate and which events they can touch.</h1>
            <p className="ev-subtitle">Use the left queue to enable scanner operators. Use the right queue to confirm who is actually assigned to each event.</p>
          </div>
        </div>
      </section>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="ev-stat">
          <div className="ev-stat-label">Scanner-capable operators</div>
          <div className="ev-stat-value">{data.operators.filter((operator) => operator.can_access_scanner).length}</div>
        </div>
        <div className="ev-stat">
          <div className="ev-stat-label">Active scan assignments</div>
          <div className="ev-stat-value">{data.assignments.filter((assignment) => assignment.can_scan).length}</div>
        </div>
        <div className="ev-stat">
          <div className="ev-stat-label">Control note</div>
          <div className="ev-stat-value text-base">Scanner access is assigned from Users, then enforced again at the event-staff layer.</div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Operator scanner access</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Enable the right gate staff</h2>
          <div className="mt-5 space-y-3">
            {data.operators.map((operator) => (
              <div key={operator.user_id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-white font-semibold">{operator.evntszn_profiles?.full_name || operator.user_id}</div>
                <div className="text-sm text-white/60">{operator.role_key}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                  {operator.can_access_scanner ? "scanner enabled" : "scanner disabled"}
                </div>
                <button
                  type="button"
                  onClick={() => updateScannerAccess(operator.user_id, !operator.can_access_scanner)}
                  className="mt-3 rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
                >
                  {operator.can_access_scanner ? "Disable scanner" : "Enable scanner"}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Live event assignments</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Confirm event-level coverage</h2>
          <div className="mt-5 space-y-3">
            {data.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-white font-semibold">{assignment.evntszn_events?.title || "Event"}</div>
                <div className="text-sm text-white/60">{assignment.evntszn_events?.city || "City"} • {assignment.role_code}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                  {assignment.can_scan ? "scan live" : assignment.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
