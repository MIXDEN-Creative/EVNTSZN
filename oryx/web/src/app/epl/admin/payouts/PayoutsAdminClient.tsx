"use client";

import { useEffect, useMemo, useState } from "react";

type RecipientSummary = {
  recipientKey: string;
  recipientType: "hq" | "city_office" | "host" | "city_leader" | "override";
  recipientId: string | null;
  recipientLabel: string;
  availableAmount: number;
  pendingAmount: number;
  paidAmount: number;
};

type LedgerOption = {
  id: string;
  amount: number;
  sourceType: string;
  createdAt: string;
  eventTitle: string;
  eventCity: string | null;
  ticketCode: string | null;
};

type PayoutHistoryItem = {
  id: string;
  recipientType: string;
  recipientLabel: string;
  amount: number;
  status: "pending" | "sent" | "failed" | "void";
  method: "manual";
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  linkCount: number;
  linkedAmount: number;
};

export default function PayoutsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<RecipientSummary[]>([]);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "pending" | "sent" | "failed" | "void">("all");
  const [selectedRecipientKey, setSelectedRecipientKey] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientSummary | null>(null);
  const [availableLedgerRows, setAvailableLedgerRows] = useState<LedgerOption[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryItem[]>([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [notes, setNotes] = useState("");

  async function load(nextRecipientKey = selectedRecipientKey) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextRecipientKey) params.set("recipientKey", nextRecipientKey);
    const response = await fetch(`/api/admin/payouts?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as {
      error?: string;
      recipients?: RecipientSummary[];
      selectedRecipient?: RecipientSummary | null;
      availableLedgerRows?: LedgerOption[];
      payoutHistory?: PayoutHistoryItem[];
    };

    if (!response.ok) {
      setMessage(payload.error || "Could not load payouts.");
      setLoading(false);
      return;
    }

    setRecipients(payload.recipients || []);
    setSelectedRecipient(payload.selectedRecipient || null);
    setSelectedRecipientKey(payload.selectedRecipient?.recipientKey || null);
    setAvailableLedgerRows(payload.availableLedgerRows || []);
    setPayoutHistory(payload.payoutHistory || []);
    setSelectedLedgerIds([]);
    setPayoutAmount("");
    setNotes("");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedTotal = useMemo(
    () =>
      availableLedgerRows
        .filter((row) => selectedLedgerIds.includes(row.id))
        .reduce((sum, row) => sum + row.amount, 0),
    [availableLedgerRows, selectedLedgerIds],
  );

  const filteredRecipients = useMemo(() => {
    const normalizedQuery = recipientQuery.trim().toLowerCase();
    return recipients.filter((recipient) => {
      if (!normalizedQuery) return true;
      return [recipient.recipientLabel, recipient.recipientType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [recipientQuery, recipients]);

  const filteredHistory = useMemo(() => {
    return payoutHistory.filter((item) => historyFilter === "all" || item.status === historyFilter);
  }, [historyFilter, payoutHistory]);

  const allVisibleLedgerSelected =
    availableLedgerRows.length > 0 && availableLedgerRows.every((row) => selectedLedgerIds.includes(row.id));

  async function createPayout() {
    if (!selectedRecipient) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientType: selectedRecipient.recipientType,
        recipientId: selectedRecipient.recipientId,
        recipientLabel: selectedRecipient.recipientLabel,
        amount: payoutAmount ? Number(payoutAmount) : selectedTotal,
        notes,
        ledgerIds: selectedLedgerIds,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Could not create payout.");
      return;
    }

    setMessage("Manual payout created.");
    await load(selectedRecipient.recipientKey);
  }

  async function updateStatus(payoutId: string, status: "sent" | "failed" | "void") {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, status }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(payload.error || "Could not update payout.");
      return;
    }
    setMessage(`Payout marked ${status}.`);
    await load(selectedRecipient?.recipientKey || null);
  }

  return (
    <main className="mx-auto max-w-[1500px]">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Payouts</div>
            <h1 className="ev-title">Create manual payouts from locked revenue without double-paying the same ledger rows.</h1>
            <p className="ev-subtitle">
              Pick a recipient, review available versus pending versus paid balance, then create a manual payout tied to exact ledger rows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Recipients</div>
              <div className="ev-meta-value">{recipients.length}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">History</div>
              <div className="ev-meta-value">{payoutHistory.length} payouts in the current view</div>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Recipients</div>
          <div className="mt-3 text-sm text-white/62">
            Pick the payout target first. The balance, available ledger rows, and payout history all follow this selection.
          </div>
          <input
            className="ev-field mt-4"
            placeholder="Search recipient or type"
            value={recipientQuery}
            onChange={(event) => setRecipientQuery(event.target.value)}
          />
          <div className="mt-4 space-y-3">
            {loading ? <div className="text-sm text-white/60">Loading payout recipients...</div> : null}
            {!loading && !filteredRecipients.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                No revenue recipients are available yet.
              </div>
            ) : null}
            {filteredRecipients.map((recipient) => (
              <button
                key={recipient.recipientKey}
                type="button"
                onClick={() => void load(recipient.recipientKey)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  recipient.recipientKey === selectedRecipientKey
                    ? "border-[#A259FF]/40 bg-[#A259FF]/10"
                    : "border-white/10 bg-black/30"
                }`}
              >
                <div className="text-sm font-semibold text-white">{recipient.recipientLabel}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">{recipient.recipientType.replace(/_/g, " ")}</div>
                <div className="mt-3 grid gap-2 text-sm text-white/65">
                  <div>Available: ${recipient.availableAmount.toFixed(2)}</div>
                  <div>Pending: ${recipient.pendingAmount.toFixed(2)}</div>
                  <div>Paid: ${recipient.paidAmount.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <section className="ev-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Balance summary</div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {selectedRecipient?.recipientLabel || "Select a recipient"}
                </div>
              </div>
              {selectedRecipient ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Available</div>
                    <div className="mt-2 text-lg font-semibold text-white">${selectedRecipient.availableAmount.toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pending</div>
                    <div className="mt-2 text-lg font-semibold text-white">${selectedRecipient.pendingAmount.toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Paid</div>
                    <div className="mt-2 text-lg font-semibold text-white">${selectedRecipient.paidAmount.toFixed(2)}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="ev-panel p-5">
            <div className="ev-section-kicker">Create payout</div>
            <p className="mt-2 text-sm text-white/62">
              Only locked ledger rows can fund a payout. Pending and sent payouts keep rows unavailable. Void releases them back to available.
            </p>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="ev-button-secondary"
                    disabled={!availableLedgerRows.length}
                    onClick={() =>
                      setSelectedLedgerIds(
                        allVisibleLedgerSelected ? [] : availableLedgerRows.map((row) => row.id),
                      )
                    }
                  >
                    {allVisibleLedgerSelected ? "Clear selection" : "Select all available"}
                  </button>
                </div>
                {!availableLedgerRows.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                    No locked revenue is currently available for payout.
                  </div>
                ) : (
                  availableLedgerRows.map((row) => (
                    <label key={row.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/72">
                      <input
                        type="checkbox"
                        checked={selectedLedgerIds.includes(row.id)}
                        onChange={(event) =>
                          setSelectedLedgerIds((current) =>
                            event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                          )
                        }
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-white">${row.amount.toFixed(2)} · {row.eventTitle}</div>
                        <div className="mt-1 text-white/55">
                          {row.eventCity || "No city"} · {row.ticketCode || "No ticket code"} · {row.sourceType.replace(/_/g, " ")}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-semibold text-white">Manual payout details</div>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/68">
                    Selected ledger amount: <span className="font-semibold text-white">${selectedTotal.toFixed(2)}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/68">
                    Selected rows: <span className="font-semibold text-white">{selectedLedgerIds.length}</span>
                  </div>
                  <input
                    className="ev-field"
                    inputMode="decimal"
                    placeholder="Payout amount (optional for partial payout)"
                    value={payoutAmount}
                    onChange={(event) => setPayoutAmount(event.target.value)}
                  />
                  <textarea
                    className="ev-textarea"
                    rows={4}
                    placeholder="Manual payout note"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                  <button
                    type="button"
                    disabled={saving || !selectedRecipient || !selectedLedgerIds.length}
                    onClick={() => void createPayout()}
                    className="ev-button-primary disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create manual payout"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="ev-panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="ev-section-kicker">Payout history</div>
                <div className="mt-2 text-sm text-white/62">
                  Review sent, failed, pending, and void payouts for the selected recipient.
                </div>
              </div>
              <select className="ev-field max-w-xs" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value as typeof historyFilter)}>
                <option value="all">All payout states</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="void">Void</option>
              </select>
            </div>
            <div className="mt-4 space-y-3">
              {!filteredHistory.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
                  No payouts have been recorded for this recipient yet.
                </div>
              ) : (
                filteredHistory.map((payout) => (
                  <div key={payout.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">${payout.amount.toFixed(2)} · {payout.recipientLabel}</div>
                        <div className="mt-1 text-sm text-white/55">
                          {payout.linkCount} ledger rows · ${payout.linkedAmount.toFixed(2)} linked · {new Date(payout.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/72">
                        {payout.status}
                      </span>
                    </div>
                    {payout.notes ? <div className="mt-3 text-sm text-white/65">{payout.notes}</div> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {payout.status === "pending" ? (
                        <>
                          <button type="button" onClick={() => void updateStatus(payout.id, "sent")} className="ev-button-secondary">
                            Mark sent
                          </button>
                          <button type="button" onClick={() => void updateStatus(payout.id, "failed")} className="ev-button-secondary">
                            Mark failed
                          </button>
                          <button type="button" onClick={() => void updateStatus(payout.id, "void")} className="ev-button-secondary">
                            Void
                          </button>
                        </>
                      ) : null}
                      {payout.status === "failed" ? (
                        <button type="button" onClick={() => void updateStatus(payout.id, "void")} className="ev-button-secondary">
                          Void and release funds
                        </button>
                      ) : null}
                      {payout.status === "sent" && payout.paidAt ? (
                        <div className="text-sm text-white/55">Sent {new Date(payout.paidAt).toLocaleString()}</div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
