"use client";

import { useEffect, useMemo, useState } from "react";

type ScannerOperator = {
  user_id: string;
  role_key: string | null;
  can_access_scanner: boolean;
  city_scope?: string[] | null;
  surface_access?: string[] | null;
  dashboard_access?: string[] | null;
  evntszn_profiles?: { full_name?: string | null; city?: string | null; state?: string | null } | null;
};

type ScannerAssignment = {
  id: string;
  user_id: string | null;
  role_code: string | null;
  can_scan: boolean;
  status: string | null;
  evntszn_events?: { title?: string | null; slug?: string | null; city?: string | null } | null;
};

export default function ScannerAdminClient() {
  const [data, setData] = useState<{ operators: ScannerOperator[]; assignments: ScannerAssignment[] }>({
    operators: [],
    assignments: [],
  });
  const [message, setMessage] = useState("");
  const [operatorQuery, setOperatorQuery] = useState("");
  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/scanner-access", { cache: "no-store" });
    const json = (await res.json()) as { operators?: ScannerOperator[]; assignments?: ScannerAssignment[]; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load scanner access.");
      return;
    }
    const nextOperators = json.operators || [];
    const nextAssignments = json.assignments || [];
    setData({ operators: nextOperators, assignments: nextAssignments });
    setSelectedOperatorId((current) => current || nextOperators[0]?.user_id || null);
    setSelectedAssignmentId((current) => current || nextAssignments[0]?.id || null);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateScannerAccess(userId: string, canAccessScanner: boolean) {
    const res = await fetch("/api/admin/scanner-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, canAccessScanner }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update scanner access.");
      return;
    }
    setMessage("Scanner access updated.");
    await load();
  }

  const filteredOperators = useMemo(() => {
    const normalizedQuery = operatorQuery.trim().toLowerCase();
    return data.operators.filter((operator) => {
      if (!normalizedQuery) return true;
      return [
        operator.evntszn_profiles?.full_name,
        operator.evntszn_profiles?.city,
        operator.role_key,
        ...(operator.city_scope || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [data.operators, operatorQuery]);

  const filteredAssignments = useMemo(() => {
    const normalizedQuery = assignmentQuery.trim().toLowerCase();
    return data.assignments.filter((assignment) => {
      if (!normalizedQuery) return true;
      return [
        assignment.evntszn_events?.title,
        assignment.evntszn_events?.city,
        assignment.role_code,
        assignment.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [assignmentQuery, data.assignments]);

  const selectedOperator =
    data.operators.find((operator) => operator.user_id === selectedOperatorId) || filteredOperators[0] || null;
  const selectedAssignment =
    data.assignments.find((assignment) => assignment.id === selectedAssignmentId) || filteredAssignments[0] || null;

  return (
    <main className="mx-auto max-w-[1500px]">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Scanner control</div>
            <h1 className="ev-title">Manage gate access, event coverage, and live scanner launch from one desk.</h1>
            <p className="ev-subtitle">
              Turn scanner access on for the right operators, confirm who is actually assigned to each event, then open the real scanner console from the assignment that will work the gate.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Scanner-capable operators</div>
              <div className="ev-meta-value">{data.operators.filter((operator) => operator.can_access_scanner).length}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Live scan assignments</div>
              <div className="ev-meta-value">{data.assignments.filter((assignment) => assignment.can_scan).length}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Operational rule</div>
              <div className="ev-meta-value">Grant scanner access here, then verify event-level coverage before opening the console.</div>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Operator access</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Enable the right gate staff</h2>
            <p className="mt-2 text-sm text-white/60">
              Use this queue to control which operator profiles can open scanner tools at all.
            </p>
            <input
              className="ev-field mt-5"
              placeholder="Search operator, role, or city"
              value={operatorQuery}
              onChange={(event) => setOperatorQuery(event.target.value)}
            />
            <div className="mt-5 space-y-3">
              {filteredOperators.map((operator) => (
                <button
                  key={operator.user_id}
                  type="button"
                  onClick={() => setSelectedOperatorId(operator.user_id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    selectedOperator?.user_id === operator.user_id
                      ? "border-[#A259FF]/45 bg-[#A259FF]/10"
                      : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-lg font-semibold text-white">{operator.evntszn_profiles?.full_name || operator.user_id}</div>
                  <div className="mt-2 text-sm text-white/58">
                    {operator.role_key || "No role key"} · {operator.evntszn_profiles?.city || "No city"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="ev-chip ev-chip--external">
                      {operator.can_access_scanner ? "Scanner enabled" : "Scanner disabled"}
                    </span>
                    {(operator.city_scope || []).slice(0, 3).map((city) => (
                      <span key={city} className="ev-chip ev-chip--external">
                        {city}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Event coverage</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Confirm who is covering each scanner lane</h2>
            <p className="mt-2 text-sm text-white/60">
              This queue shows event-level assignments. If the event has a slug, you can open the live scanner directly from here.
            </p>
            <input
              className="ev-field mt-5"
              placeholder="Search event, city, or role"
              value={assignmentQuery}
              onChange={(event) => setAssignmentQuery(event.target.value)}
            />
            <div className="mt-5 space-y-3">
              {filteredAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    selectedAssignment?.id === assignment.id
                      ? "border-[#A259FF]/45 bg-[#A259FF]/10"
                      : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-lg font-semibold text-white">{assignment.evntszn_events?.title || "Event"}</div>
                  <div className="mt-2 text-sm text-white/58">
                    {assignment.evntszn_events?.city || "No city"} · {assignment.role_code || "No role"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="ev-chip ev-chip--external">
                      {assignment.can_scan ? "Scan live" : assignment.status || "Pending"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Selected operator</div>
            {!selectedOperator ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-5 text-white/58">
                Select an operator to review scanner access.
              </div>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-bold text-white">{selectedOperator.evntszn_profiles?.full_name || selectedOperator.user_id}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Scanner access</div>
                    <div className="mt-2 text-base font-semibold text-white">{selectedOperator.can_access_scanner ? "Enabled" : "Disabled"}</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Role</div>
                    <div className="mt-2 text-base font-semibold text-white">{selectedOperator.role_key || "No role key"}</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">City scope</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {(selectedOperator.city_scope || []).length ? selectedOperator.city_scope?.join(", ") : "No city scope"}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateScannerAccess(selectedOperator.user_id, !selectedOperator.can_access_scanner)}
                    className="ev-button-primary"
                  >
                    {selectedOperator.can_access_scanner ? "Disable scanner access" : "Enable scanner access"}
                  </button>
                  <a href="/epl/admin/team" className="ev-button-secondary">
                    Open Team &amp; Access
                  </a>
                </div>
              </>
            )}
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Selected assignment</div>
            {!selectedAssignment ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-5 text-white/58">
                Select an event assignment to review scanner coverage.
              </div>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-bold text-white">{selectedAssignment.evntszn_events?.title || "Event"}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">City</div>
                    <div className="mt-2 text-base font-semibold text-white">{selectedAssignment.evntszn_events?.city || "No city"}</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Coverage</div>
                    <div className="mt-2 text-base font-semibold text-white">{selectedAssignment.can_scan ? "Live scanner coverage" : selectedAssignment.status || "Pending"}</div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Role</div>
                    <div className="mt-2 text-base font-semibold text-white">{selectedAssignment.role_code || "No role"}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedAssignment.evntszn_events?.slug ? (
                    <a href={`/scanner/${selectedAssignment.evntszn_events.slug}`} className="ev-button-primary">
                      Open scanner
                    </a>
                  ) : null}
                  <a href="/epl/admin/events" className="ev-button-secondary">
                    Open events desk
                  </a>
                </div>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
