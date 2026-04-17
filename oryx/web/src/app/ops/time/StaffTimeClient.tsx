"use client";

import { useEffect, useMemo, useState } from "react";

type Assignment = {
  id: string;
  position: {
    id: string;
    title: string;
    city?: string | null;
    pay_type?: string | null;
    pay_amount_usd?: number | null;
  } | null;
};

type TimeEntry = {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  break_started_at?: string | null;
  break_minutes: number;
  minutes_worked: number;
  regular_minutes?: number;
  overtime_minutes?: number;
};

export default function StaffTimeClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/workforce/time", { cache: "no-store" });
    const json = (await res.json()) as { assignments?: Assignment[]; entries?: TimeEntry[]; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load time tracking.");
      return;
    }
    const nextAssignments = json.assignments || [];
    setAssignments(nextAssignments);
    setEntries(json.entries || []);
    setSelectedAssignmentId((current) => current || nextAssignments[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  const openEntry = useMemo(() => entries.find((entry) => !entry.ended_at && (entry.status === "draft" || entry.status === "corrected")) || null, [entries]);
  const draftEntry = useMemo(() => entries.find((entry) => entry.ended_at && (entry.status === "draft" || entry.status === "corrected")) || null, [entries]);

  async function act(action: string) {
    const res = await fetch("/api/workforce/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        staffAssignmentId: selectedAssignmentId,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update time entry.");
      return;
    }
    setMessage("Time updated.");
    await load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Time tracking</div>
            <h1 className="ev-title">Clock in, log breaks, and submit your hours.</h1>
            <p className="ev-subtitle">Use this page for event-day labor, staffing shifts, and payout-ready time without guessing what counts.</p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Shift</div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/64">
            Step 1: choose your assignment. Step 2: clock in. Step 3: log breaks if needed. Step 4: clock out. Step 5: submit the finished shift.
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Current status</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {openEntry ? (openEntry.break_started_at ? "On break" : "Clocked in") : draftEntry ? "Ready to submit" : "Not clocked in"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Next action</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {openEntry ? "Clock out when the shift ends." : draftEntry ? "Submit the completed shift." : "Start a shift with Clock in."}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4">
            <select className="ev-field" value={selectedAssignmentId} onChange={(event) => setSelectedAssignmentId(event.target.value)}>
              <option value="">Select assignment</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.position?.title || "Assigned role"}{assignment.position?.city ? ` • ${assignment.position.city}` : ""}
                </option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="ev-button-primary" disabled={!selectedAssignmentId || Boolean(openEntry)} onClick={() => void act("clock_in")}>
                Clock in
              </button>
              <button type="button" className="ev-button-secondary" disabled={!openEntry} onClick={() => void act("clock_out")}>
                Clock out
              </button>
              <button type="button" className="ev-button-secondary" disabled={!openEntry} onClick={() => void act("break_start")}>
                Start break
              </button>
              <button type="button" className="ev-button-secondary" disabled={!openEntry} onClick={() => void act("break_end")}>
                End break
              </button>
            </div>

              <button type="button" className="ev-button-secondary" disabled={!draftEntry} onClick={() => void act("submit")}>
                Submit hours
              </button>
            </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Recent time</div>
          <div className="mt-4 space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">No time entries yet.</div>
            ) : null}
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{entry.status}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">{Math.round((entry.minutes_worked || 0) / 60 * 10) / 10}h</div>
                </div>
                <div className="mt-2 text-sm text-white/60">
                  {entry.started_at ? new Date(entry.started_at).toLocaleString() : "—"} {entry.ended_at ? `→ ${new Date(entry.ended_at).toLocaleString()}` : "• active"}
                </div>
                <div className="mt-2 text-xs text-white/48">
                  Regular {Math.round((((entry.regular_minutes || 0) / 60) || 0) * 100) / 100}h • OT {Math.round((((entry.overtime_minutes || 0) / 60) || 0) * 100) / 100}h • Break {Math.round((((entry.break_minutes || 0) / 60) || 0) * 100) / 100}h
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
