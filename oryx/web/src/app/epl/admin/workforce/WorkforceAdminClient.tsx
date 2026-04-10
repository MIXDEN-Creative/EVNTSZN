"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPayoutLabel } from "@/lib/workforce";

type WorkforceEntry = {
  id: string;
  user_id: string;
  user_name: string;
  city: string | null;
  office_label: string | null;
  position_title: string | null;
  event_title: string | null;
  pay_type: string | null;
  pay_amount_cents: number | null;
  employment_type: string | null;
  minutes_worked: number;
  regular_minutes?: number;
  overtime_minutes?: number;
  estimated_payout_cents: number;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  manager_notes: string | null;
};

type PayPeriod = {
  id: string;
  label: string;
  period_type: string;
  starts_on: string;
  ends_on: string;
  status: string;
  overtime_daily_threshold_hours?: number;
  overtime_weekly_threshold_hours?: number;
};

type PayrollSummary = {
  userId: string;
  userName: string;
  city: string | null;
  payType: string;
  regularHours: number;
  overtimeHours: number;
  approvedHours: number;
  pendingHours: number;
  estimatedGrossPayoutCents: number;
};

export default function WorkforceAdminClient() {
  const [entries, setEntries] = useState<WorkforceEntry[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPayPeriodId, setSelectedPayPeriodId] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ status: "", city: "", payType: "" });
  const [managerNotes, setManagerNotes] = useState("");
  const [minutesWorked, setMinutesWorked] = useState("");
  const [summaries, setSummaries] = useState<any>(null);

  async function load() {
    const params = new URLSearchParams();
    if (selectedPayPeriodId) params.set("payPeriodId", selectedPayPeriodId);
    const res = await fetch(`/api/admin/workforce${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
    const json = (await res.json()) as { entries?: WorkforceEntry[]; payPeriods?: PayPeriod[]; payrollSummaries?: PayrollSummary[]; summaries?: any; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load workforce records.");
      return;
    }
    const nextEntries = json.entries || [];
    setEntries(nextEntries);
    setPayPeriods(json.payPeriods || []);
    setPayrollSummaries(json.payrollSummaries || []);
    setSummaries(json.summaries || null);
    setSelectedId((current) => current || nextEntries[0]?.id || null);
    if (!selectedPayPeriodId && json.payPeriods?.[0]?.id) setSelectedPayPeriodId(json.payPeriods[0].id);
  }

  useEffect(() => {
    void load();
  }, [selectedPayPeriodId]);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (filters.status && entry.status !== filters.status) return false;
        if (filters.city && entry.city !== filters.city) return false;
        if (filters.payType && entry.pay_type !== filters.payType) return false;
        return true;
      }),
    [entries, filters],
  );

  const selectedEntry = filteredEntries.find((entry) => entry.id === selectedId) || entries.find((entry) => entry.id === selectedId) || null;
  const selectedPayPeriod = payPeriods.find((period) => period.id === selectedPayPeriodId) || null;

  useEffect(() => {
    setManagerNotes(selectedEntry?.manager_notes || "");
    setMinutesWorked(selectedEntry?.minutes_worked ? String(selectedEntry.minutes_worked) : "");
  }, [selectedEntry?.id]);

  async function update(action: string, extra: Record<string, unknown> = {}) {
    if (!selectedEntry) return;
    const res = await fetch("/api/admin/workforce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        entryId: selectedEntry.id,
        managerNotes,
        ...extra,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update workforce entry.");
      return;
    }
    setMessage("Workforce record updated.");
    await load();
  }

  function downloadExport() {
    const params = new URLSearchParams({ format: "csv" });
    if (selectedPayPeriodId) params.set("payPeriodId", selectedPayPeriodId);
    window.location.href = `/api/admin/workforce?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Workforce</div>
            <h1 className="ev-title">Track hours, review exceptions, and move payroll-ready time forward.</h1>
            <p className="ev-subtitle">
              Use this desk to review time submitted by paid staff, correct entries, and keep event-day labor clean across offices, positions, and league nights.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Pending</div>
              <div className="ev-meta-value">{summaries?.pending ?? 0}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Approved hours</div>
              <div className="ev-meta-value">{summaries?.approvedHours ?? 0}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Pending hours</div>
              <div className="ev-meta-value">{summaries?.pendingHours ?? 0}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Estimated payout</div>
              <div className="ev-meta-value">${((summaries?.estimatedPayrollCents ?? 0) / 100).toFixed(0)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Overtime hours</div>
              <div className="ev-meta-value">{summaries?.overtimeHours ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <section className="ev-panel mt-6 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <select className="ev-field" value={selectedPayPeriodId} onChange={(event) => setSelectedPayPeriodId(event.target.value)}>
            <option value="">All pay periods</option>
            {payPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {["draft", "submitted", "approved", "rejected", "corrected", "ready_for_payroll"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}>
            <option value="">All cities</option>
            {Array.from(new Set(entries.map((entry) => entry.city).filter(Boolean))).map((city) => (
              <option key={city} value={city || ""}>
                {city}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.payType} onChange={(event) => setFilters((current) => ({ ...current, payType: event.target.value }))}>
            <option value="">All pay types</option>
            {Array.from(new Set(entries.map((entry) => entry.pay_type).filter(Boolean))).map((payType) => (
              <option key={payType} value={payType || ""}>
                {payType}
              </option>
            ))}
          </select>
          <button type="button" className="ev-button-secondary" onClick={downloadExport}>
            Export payroll CSV
          </button>
        </div>
        {selectedPayPeriod ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/64">
            {selectedPayPeriod.label} • {selectedPayPeriod.period_type} • daily OT after {selectedPayPeriod.overtime_daily_threshold_hours ?? 8}h • weekly OT after {selectedPayPeriod.overtime_weekly_threshold_hours ?? 40}h
          </div>
        ) : null}
        <div className="mt-3 text-xs text-white/45">Export uses the current pay-period selection and the same payroll summary shown below.</div>
      </section>

      <section className="ev-panel mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="ev-section-kicker">Payroll summary</div>
            <div className="mt-2 text-xl font-bold text-white">Regular, overtime, approved, and pending hours by worker</div>
          </div>
          <div className="text-sm text-white/52">{payrollSummaries.length} workers</div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.22em] text-white/45">
              <tr>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Pay type</th>
                <th className="px-4 py-3">Regular</th>
                <th className="px-4 py-3">Overtime</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Estimated gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {payrollSummaries.map((summary) => (
                <tr key={summary.userId}>
                  <td className="px-4 py-3 text-white">{summary.userName}</td>
                  <td className="px-4 py-3 text-white/62">{summary.city || "—"}</td>
                  <td className="px-4 py-3 text-white/62">{summary.payType}</td>
                  <td className="px-4 py-3 text-white/62">{summary.regularHours}</td>
                  <td className="px-4 py-3 text-white/62">{summary.overtimeHours}</td>
                  <td className="px-4 py-3 text-white/62">{summary.approvedHours}</td>
                  <td className="px-4 py-3 text-white/62">{summary.pendingHours}</td>
                  <td className="px-4 py-3 text-white">${(summary.estimatedGrossPayoutCents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Time queue</div>
          <div className="mt-4 space-y-3">
            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={`w-full rounded-2xl border p-4 text-left ${entry.id === selectedId ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-white">{entry.user_name}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">{entry.status}</div>
                </div>
                <div className="mt-2 text-sm text-white/55">{entry.position_title || "Unlinked position"}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                  {[
                    entry.city,
                    `${Math.round(((entry.minutes_worked || 0) / 60) * 10) / 10}h`,
                    `reg ${Math.round((((entry.regular_minutes || 0) / 60) || 0) * 10) / 10}h`,
                    `ot ${Math.round((((entry.overtime_minutes || 0) / 60) || 0) * 10) / 10}h`,
                    formatPayoutLabel({
                      payType: entry.pay_type,
                      payAmountCents: entry.pay_amount_cents,
                    }),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ev-panel p-6">
          {!selectedEntry ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">Select a time entry to review hours, payout basis, and exceptions.</div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="ev-section-kicker">Time record</div>
                  <h2 className="mt-3 text-2xl font-bold text-white">{selectedEntry.user_name}</h2>
                  <div className="mt-2 text-sm text-white/60">
                    {[selectedEntry.position_title, selectedEntry.event_title, selectedEntry.city].filter(Boolean).join(" • ")}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/65">
                  {formatPayoutLabel({
                    payType: selectedEntry.pay_type,
                    payAmountCents: selectedEntry.pay_amount_cents,
                  })}{" "}
                  • {Math.round(((selectedEntry.minutes_worked || 0) / 60) * 10) / 10}h
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Started</div><div className="mt-2 text-white">{selectedEntry.started_at ? new Date(selectedEntry.started_at).toLocaleString() : "—"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Ended</div><div className="mt-2 text-white">{selectedEntry.ended_at ? new Date(selectedEntry.ended_at).toLocaleString() : "—"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Pay type</div><div className="mt-2 text-white">{selectedEntry.pay_type || "hourly"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Employment</div><div className="mt-2 text-white">{selectedEntry.employment_type || "event_based"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Regular hours</div><div className="mt-2 text-white">{Math.round((((selectedEntry.regular_minutes || 0) / 60) || 0) * 100) / 100}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.18em] text-white/45">Overtime hours</div><div className="mt-2 text-white">{Math.round((((selectedEntry.overtime_minutes || 0) / 60) || 0) * 100) / 100}</div></div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                    Review the hours split first, then approve, send to payroll, correct, or reject.
                  </div>
                  <input className="ev-field" value={minutesWorked} onChange={(event) => setMinutesWorked(event.target.value)} placeholder="Correct minutes worked" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className="ev-button-primary" onClick={() => void update("approve")} >Approve</button>
                    <button type="button" className="ev-button-secondary" onClick={() => void update("approve", { readyForPayroll: true })}>Ready for payroll</button>
                    <button type="button" className="ev-button-secondary" onClick={() => void update("correct", { minutesWorked: Number(minutesWorked || 0) })}>Correct hours</button>
                    <button type="button" className="rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10" onClick={() => void update("reject")}>Reject</button>
                  </div>
                </div>
                <div>
                  <textarea className="ev-textarea" rows={8} value={managerNotes} onChange={(event) => setManagerNotes(event.target.value)} placeholder="Add manager notes, exception details, or correction context." />
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
