"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RegistrationRow = {
  application: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    status: string | null;
    pipeline_stage: string | null;
    submitted_at: string | null;
    internal_notes: string | null;
    assigned_reviewer_user_id: string | null;
  };
  registration: {
    id: string;
    registration_status: string | null;
    player_status: string | null;
    registration_code: string | null;
    waived_fee: boolean | null;
  } | null;
  pool: {
    assigned_to_team: boolean | null;
    draft_eligible: boolean | null;
    draft_eligibility_reason: string | null;
  } | null;
  waiverStatus: string;
  waiverUrl: string;
  hasHeadshot: boolean;
  hasJerseyDetails: boolean;
  paymentComplete: boolean;
};

type Reviewer = {
  userId: string;
  fullName: string | null;
};

type WaiverWebhookIssue = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  match_status: string;
  notes: string | null;
  candidate_application_ids: string[] | null;
  created_at: string | null;
};

function stageBadge(label: string, tone: "ready" | "pending" | "review") {
  const toneClass =
    tone === "ready"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : tone === "review"
        ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
        : "border-white/10 bg-white/[0.04] text-white/72";

  return <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClass}`}>{label}</span>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function SeasonOneAdminClient({
  rows,
  reviewers,
  waiverIssues,
}: {
  rows: RegistrationRow[];
  reviewers: Reviewer[];
  waiverIssues: WaiverWebhookIssue[];
}) {
  const [registrationRows, setRegistrationRows] = useState(rows);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(rows[0]?.application.id || null);
  const [form, setForm] = useState({
    applicationStatus: rows[0]?.application.status || "submitted",
    pipelineStage: rows[0]?.application.pipeline_stage || "submitted",
    registrationStatus: rows[0]?.registration?.registration_status || "pending_payment",
    playerStatus: rows[0]?.registration?.player_status || "prospect",
    waiverStatus: rows[0]?.waiverStatus || "pending",
    draftEligible: rows[0]?.pool?.draft_eligible ?? false,
    waivedFee: rows[0]?.registration?.waived_fee ?? false,
    internalNotes: rows[0]?.application.internal_notes || "",
    assignedReviewerUserId: rows[0]?.application.assigned_reviewer_user_id || "",
  });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registrationRows;
    return registrationRows.filter((row) =>
      [
        row.application.first_name,
        row.application.last_name,
        row.application.email,
        row.application.city,
        row.application.status,
        row.application.pipeline_stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [registrationRows, search]);

  const selectedRow =
    filteredRows.find((row) => row.application.id === selectedApplicationId) ||
    registrationRows.find((row) => row.application.id === selectedApplicationId) ||
    null;

  function syncForm(row: RegistrationRow | null) {
    if (!row) return;
    setForm({
      applicationStatus: row.application.status || "submitted",
      pipelineStage: row.application.pipeline_stage || "submitted",
      registrationStatus: row.registration?.registration_status || "pending_payment",
      playerStatus: row.registration?.player_status || "prospect",
      waiverStatus: row.waiverStatus || "pending",
      draftEligible: row.pool?.draft_eligible ?? false,
      waivedFee: row.registration?.waived_fee ?? false,
      internalNotes: row.application.internal_notes || "",
      assignedReviewerUserId: row.application.assigned_reviewer_user_id || "",
    });
  }

  async function saveSelectedRow() {
    if (!selectedRow) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/epl/admin/player-registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedRow.application.id,
          applicationStatus: form.applicationStatus,
          pipelineStage: form.pipelineStage,
          registrationStatus: form.registrationStatus,
          playerStatus: form.playerStatus,
          waiverStatus: form.waiverStatus,
          draftEligible: form.draftEligible,
          waivedFee: form.waivedFee,
          internalNotes: form.internalNotes,
          assignedReviewerUserId: form.assignedReviewerUserId || null,
        }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error || "Could not save registration review.");
      setRegistrationRows((current) =>
        current.map((row) =>
          row.application.id === selectedRow.application.id
            ? {
                ...row,
                application: {
                  ...row.application,
                  status: form.applicationStatus,
                  pipeline_stage: form.pipelineStage,
                  internal_notes: form.internalNotes,
                  assigned_reviewer_user_id: form.assignedReviewerUserId || null,
                },
                registration: row.registration
                  ? {
                      ...row.registration,
                      registration_status: form.registrationStatus,
                      player_status: form.playerStatus,
                      waived_fee: form.waivedFee,
                    }
                  : row.registration,
                pool: row.pool
                  ? {
                      ...row.pool,
                      draft_eligible: form.draftEligible,
                    }
                  : row.pool,
                waiverStatus: form.waiverStatus,
              }
            : row,
        ),
      );
      setMessage("Registration review updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save registration review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="ev-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="ev-section-kicker">Registration queue</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Season 1 player registrations</h2>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players, city, or stage"
            className="ev-field max-w-sm"
          />
        </div>

        <div className="mt-6 grid gap-4">
          {filteredRows.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-black/20 p-5 text-sm text-white/55">
              No player registrations match this search.
            </div>
          ) : (
            filteredRows.map((row) => {
              const isSelected = row.application.id === selectedApplicationId;
              return (
                <button
                  key={row.application.id}
                  type="button"
                  onClick={() => {
                    setSelectedApplicationId(row.application.id);
                    syncForm(row);
                  }}
                  className={`rounded-[24px] border p-5 text-left transition ${
                    isSelected ? "border-[#A259FF]/35 bg-[#A259FF]/10" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {`${row.application.first_name || ""} ${row.application.last_name || ""}`.trim() || "Unnamed player"}
                      </div>
                      <div className="mt-1 text-sm text-white/62">{row.application.email || "No email"}</div>
                      <div className="mt-2 text-sm text-white/48">
                        {[row.application.city, row.application.state, row.application.status, row.application.pipeline_stage].filter(Boolean).join(" • ") || "Awaiting review"}
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/52">
                      <div>{formatDate(row.application.submitted_at)}</div>
                      <div className="mt-2">{row.application.assigned_reviewer_user_id ? reviewers.find((reviewer) => reviewer.userId === row.application.assigned_reviewer_user_id)?.fullName || "Assigned reviewer" : "Unassigned owner"}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stageBadge("submitted", "ready")}
                    {stageBadge(row.hasHeadshot ? "photo complete" : "photo pending", row.hasHeadshot ? "ready" : "pending")}
                    {stageBadge(row.waiverStatus === "complete" ? "waiver complete" : "waiver pending", row.waiverStatus === "complete" ? "ready" : "review")}
                    {stageBadge(row.hasJerseyDetails ? "jersey complete" : "jersey pending", row.hasJerseyDetails ? "ready" : "pending")}
                    {stageBadge(row.paymentComplete ? "payment complete" : "payment pending", row.paymentComplete ? "ready" : "pending")}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="ev-panel p-6">
        {!selectedRow ? (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-black/20 p-5 text-sm text-white/55">
            Select a player registration to review its stage, payment, waiver, and draft readiness.
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Selected registration</div>
                <h2 className="mt-3 text-3xl font-bold text-white">
                  {`${selectedRow.application.first_name || ""} ${selectedRow.application.last_name || ""}`.trim() || "Unnamed player"}
                </h2>
                <p className="mt-2 text-sm text-white/62">
                  {selectedRow.application.email || "No email"} {[selectedRow.application.city, selectedRow.application.state].filter(Boolean).length ? `• ${[selectedRow.application.city, selectedRow.application.state].filter(Boolean).join(", ")}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/epl/admin/approvals" className="ev-button-secondary">Open approvals</Link>
                <Link href="/epl/admin/draft" className="ev-button-secondary">Open draft console</Link>
                <a href={selectedRow.waiverUrl} target="_blank" rel="noreferrer" className="ev-button-secondary">Open waiver</a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Application", selectedRow.application.status || "submitted"],
                ["Registration", selectedRow.registration?.registration_status || "pending_payment"],
                ["Player status", selectedRow.registration?.player_status || "prospect"],
                ["Draft", selectedRow.pool?.draft_eligible ? "eligible" : "not ready"],
                ["Owner", reviewers.find((reviewer) => reviewer.userId === (selectedRow.application.assigned_reviewer_user_id || ""))?.fullName || "Unassigned"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
                  <div className="mt-2 text-base font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold text-white">Registration stages</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {stageBadge("submitted", "ready")}
                {stageBadge(selectedRow.hasHeadshot ? "profile / headshot complete" : "profile / headshot pending", selectedRow.hasHeadshot ? "ready" : "pending")}
                {stageBadge(selectedRow.waiverStatus === "complete" ? "waiver complete" : "waiver pending", selectedRow.waiverStatus === "complete" ? "ready" : "review")}
                {stageBadge(selectedRow.hasJerseyDetails ? "jersey details complete" : "jersey details pending", selectedRow.hasJerseyDetails ? "ready" : "pending")}
                {stageBadge(selectedRow.paymentComplete ? "payment complete" : "payment pending", selectedRow.paymentComplete ? "ready" : "pending")}
                {stageBadge(selectedRow.pool?.assigned_to_team ? "assigned to team" : "not assigned", selectedRow.pool?.assigned_to_team ? "ready" : "review")}
                {stageBadge(selectedRow.application.pipeline_stage || "review pending", selectedRow.application.pipeline_stage === "approved" ? "ready" : "review")}
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/62">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Next action</div>
                <div className="mt-2 text-white">
                  {selectedRow.waiverStatus !== "complete"
                    ? "Waiver is still blocking this file."
                    : !selectedRow.paymentComplete
                      ? "Payment still needs to clear."
                      : !selectedRow.hasHeadshot
                        ? "Headshot is still missing from the player file."
                        : !selectedRow.hasJerseyDetails
                          ? "Jersey details still need to be completed."
                          : !selectedRow.pool?.draft_eligible
                            ? "Review draft eligibility before assignment."
                            : !selectedRow.pool?.assigned_to_team
                              ? "Player is ready for draft-night assignment."
                              : "Player file is complete and already tied to a team."}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">Operator updates</div>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Assigned reviewer / owner</span>
                    <select className="ev-field" value={form.assignedReviewerUserId} onChange={(event) => setForm((current) => ({ ...current, assignedReviewerUserId: event.target.value }))}>
                      <option value="">Unassigned</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.userId} value={reviewer.userId}>{reviewer.fullName || reviewer.userId}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Application status</span>
                    <select className="ev-field" value={form.applicationStatus} onChange={(event) => setForm((current) => ({ ...current, applicationStatus: event.target.value }))}>
                      {["submitted", "reviewing", "approved", "waitlisted", "declined"].map((value) => (
                        <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Pipeline stage</span>
                    <select className="ev-field" value={form.pipelineStage} onChange={(event) => setForm((current) => ({ ...current, pipelineStage: event.target.value }))}>
                      {["submitted", "reviewing", "waiver_pending", "payment_pending", "draft_ready", "assigned", "approved"].map((value) => (
                        <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Waiver status</span>
                    <select className="ev-field" value={form.waiverStatus} onChange={(event) => setForm((current) => ({ ...current, waiverStatus: event.target.value }))}>
                      <option value="pending">pending</option>
                      <option value="complete">complete</option>
                    </select>
                  </label>
                  <textarea
                    className="ev-textarea"
                    rows={4}
                    value={form.internalNotes}
                    onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))}
                    placeholder="Internal review notes"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">Registration and roster controls</div>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Registration status</span>
                    <select className="ev-field" value={form.registrationStatus} onChange={(event) => setForm((current) => ({ ...current, registrationStatus: event.target.value }))}>
                      {["pending_payment", "approved", "paid", "waitlisted", "declined"].map((value) => (
                        <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-white/72">
                    <span>Player status</span>
                    <select className="ev-field" value={form.playerStatus} onChange={(event) => setForm((current) => ({ ...current, playerStatus: event.target.value }))}>
                      {["prospect", "active", "waitlisted", "inactive"].map((value) => (
                        <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">
                    <span>Draft eligible</span>
                    <input type="checkbox" checked={form.draftEligible} onChange={(event) => setForm((current) => ({ ...current, draftEligible: event.target.checked }))} />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">
                    <span>Fee waived</span>
                    <input type="checkbox" checked={form.waivedFee} onChange={(event) => setForm((current) => ({ ...current, waivedFee: event.target.checked }))} />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-white/58">
              Team assignment still happens in the draft console and live draftboard flow. This desk handles registration readiness, waiver tracking, payment status, and review notes.
            </div>

            {waiverIssues.length ? (
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">Waiver webhook exceptions</div>
                <div className="mt-4 grid gap-3">
                  {waiverIssues.map((issue) => (
                    <div key={issue.id} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/68">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-semibold text-white">
                          {[issue.first_name, issue.last_name].filter(Boolean).join(" ").trim() || issue.email || "Unnamed submission"}
                        </div>
                        {stageBadge(issue.match_status, issue.match_status === "matched" ? "ready" : "review")}
                      </div>
                      <div className="mt-1 text-white/52">{issue.email || "No email"} • {formatDate(issue.created_at)}</div>
                      <div className="mt-2 text-white/60">{issue.notes || "Needs operator review before this waiver can be attached safely."}</div>
                      {issue.candidate_application_ids?.length ? (
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">
                          {issue.candidate_application_ids.length} possible registration match{issue.candidate_application_ids.length === 1 ? "" : "es"}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {message ? <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/75">{message}</div> : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void saveSelectedRow()} disabled={saving} className="ev-button-primary">
                {saving ? "Saving..." : "Save registration review"}
              </button>
              <a href="/epl/draft/season-1" target="_blank" rel="noreferrer" className="ev-button-secondary">Open live draftboard</a>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
