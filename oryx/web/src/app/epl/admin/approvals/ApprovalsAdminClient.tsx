"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  getOperatorRoleOptions,
  getOrganizerClassificationLabel,
  getOrganizerClassificationOptions,
  inferOrganizerClassification,
} from "@/lib/operator-access";

type ApplicationRecord = {
  id: string;
  full_name: string;
  email: string;
  application_type: string;
  status: string;
  city?: string | null;
  motivation?: string | null;
  requested_role_key?: string | null;
  organizer_classification?: string | null;
  discovery_eligible?: boolean | null;
  submitted_at?: string | null;
};

const roleOptions = getOperatorRoleOptions();
const organizerClassificationOptions = getOrganizerClassificationOptions();
const stageOrder = ["submitted", "reviewing", "approved", "rejected"] as const;

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No timestamp" : date.toLocaleString();
}

function getQueueStage(status: string) {
  if (status === "approved" || status === "rejected" || status === "reviewing") return status;
  return "submitted";
}

export default function ApprovalsAdminClient() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/operator-applications", { cache: "no-store" });
    const data = (await res.json()) as { applications?: ApplicationRecord[]; error?: string };
    if (res.ok) {
      const next = data.applications || [];
      setApplications(next);
      setSelectedId((current) => current || next[0]?.id || null);
      setMessage("");
    } else {
      setMessage(data.error || "Could not load applications.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) || null,
    [applications, selectedId],
  );

  const stageCounts = useMemo(
    () =>
      stageOrder.map((stage) => ({
        stage,
        count: applications.filter((application) => getQueueStage(application.status) === stage).length,
      })),
    [applications],
  );

  const applicationsByPriority = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const aStage = stageOrder.indexOf(getQueueStage(a.status));
        const bStage = stageOrder.indexOf(getQueueStage(b.status));
        if (aStage !== bStage) return aStage - bStage;
        return new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime();
      }),
    [applications],
  );

  async function updateApplication(applicationId: string, payload: Record<string, unknown>) {
    setSavingId(applicationId);
    const res = await fetch(`/api/admin/operator-applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    setSavingId(null);
    if (!res.ok) {
      setMessage(data.error || "Could not update application.");
      return;
    }
    setMessage("Application updated.");
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Approvals</div>
            <h1 className="ev-title">Review onboarding requests and move each applicant to the next decision.</h1>
            <p className="ev-subtitle">
              Use this queue to review host, organizer, partner, and operator applications, set the right track, and approve only what is ready to go live.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stageCounts.map((item) => (
              <div key={item.stage} className="ev-meta-card">
                <div className="ev-meta-label">{item.stage}</div>
                <div className="ev-meta-value">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className="ev-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">Queue</div>
              <div className="mt-2 text-xl font-bold text-white">Applications waiting on review</div>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/55">
              {applications.length} total
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`approval-skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-5 w-44 rounded bg-white/10" />
                  <div className="mt-2 h-4 w-52 rounded bg-white/10" />
                </div>
              ))
            ) : null}
            {!loading && applicationsByPriority.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
                No host, organizer, or partner applications are waiting right now.
              </div>
            ) : null}

            <AnimatePresence initial={false}>
            {applicationsByPriority.map((application) => {
              const classification = String(
                application.organizer_classification ||
                  inferOrganizerClassification(application.requested_role_key || application.application_type),
              );
              return (
                <motion.button
                  key={application.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  type="button"
                  onClick={() => setSelectedId(application.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === application.id
                      ? "border-[#A259FF]/40 bg-[#A259FF]/10"
                      : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">
                    {getQueueStage(application.status)}
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{application.full_name}</div>
                  <div className="mt-1 text-sm text-white/55">{application.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>{application.application_type}</span>
                    <span>{getOrganizerClassificationLabel(classification)}</span>
                    {application.city ? <span>{application.city}</span> : null}
                  </div>
                  <div className="mt-2 text-xs text-white/40">{formatDate(application.submitted_at)}</div>
                  {getQueueStage(application.status) !== "approved" ? (
                    <div className="mt-3">
                      <span
                        onClick={(event) => {
                          event.stopPropagation();
                          void updateApplication(application.id, {
                            status: "approved",
                            role_key: application.requested_role_key || application.application_type,
                            organizer_classification:
                              application.organizer_classification ||
                              inferOrganizerClassification(
                                application.requested_role_key || application.application_type,
                              ),
                            discovery_eligible: true,
                          });
                        }}
                        className="inline-flex cursor-pointer rounded-full border border-[#A259FF]/30 bg-[#A259FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e5daff]"
                      >
                        Quick approve
                      </span>
                    </div>
                  ) : null}
                </motion.button>
              );
            })}
            </AnimatePresence>
          </div>
        </section>

        <section className="ev-panel p-6">
          {!selectedApplication ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
              Select an application to review identity, assign the right operating track, and approve or reject the request.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="ev-section-kicker">Application detail</div>
                  <h2 className="mt-3 text-2xl font-bold text-white">{selectedApplication.full_name}</h2>
                  <div className="mt-2 text-sm text-white/60">{selectedApplication.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                    <span>{selectedApplication.application_type}</span>
                    <span>{getQueueStage(selectedApplication.status)}</span>
                    <span>
                      {getOrganizerClassificationLabel(
                        String(
                          selectedApplication.organizer_classification ||
                            inferOrganizerClassification(
                              selectedApplication.requested_role_key || selectedApplication.application_type,
                            ),
                        ),
                      )}
                    </span>
                    {selectedApplication.city ? <span>{selectedApplication.city}</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/65">
                  Submitted {formatDate(selectedApplication.submitted_at)}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-6">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Decision summary</div>
                    <div className="mt-3 text-sm leading-7 text-white/75">
                      {String(selectedApplication.organizer_classification || "").includes("independent")
                        ? "This applicant stays on the independent organizer track unless you intentionally move them into the EVNTSZN Host network."
                        : "This applicant is on the EVNTSZN Host path. Approving them can unlock host tooling, city support, and discovery eligibility."}
                    </div>
                    {selectedApplication.motivation ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
                        {selectedApplication.motivation}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/45">
                        No motivation or note was provided with this request.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Access path</div>
                    <div className="mt-4 grid gap-4">
                      <label className="grid gap-2 text-sm text-white/72">
                        <span>Requested role</span>
                        <select
                          defaultValue={selectedApplication.requested_role_key || selectedApplication.application_type}
                          onChange={(e) =>
                            updateApplication(selectedApplication.id, {
                              status: "reviewing",
                              role_key: e.target.value,
                            })
                          }
                          className="ev-field"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm text-white/72">
                        <span>Operating track</span>
                        <select
                          defaultValue={
                            selectedApplication.organizer_classification ||
                            inferOrganizerClassification(
                              selectedApplication.requested_role_key || selectedApplication.application_type,
                            )
                          }
                          onChange={(e) =>
                            updateApplication(selectedApplication.id, {
                              status: "reviewing",
                              organizer_classification: e.target.value,
                            })
                          }
                          className="ev-field"
                        >
                          {organizerClassificationOptions.map((classification) => (
                            <option key={classification.value} value={classification.value}>
                              {classification.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Actions</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() =>
                          updateApplication(selectedApplication.id, {
                            status: "approved",
                            role_key:
                              selectedApplication.requested_role_key || selectedApplication.application_type,
                            organizer_classification:
                              selectedApplication.organizer_classification ||
                              inferOrganizerClassification(
                                selectedApplication.requested_role_key || selectedApplication.application_type,
                              ),
                            discovery_eligible: true,
                          })
                        }
                        disabled={savingId === selectedApplication.id}
                        className="ev-button-primary"
                      >
                        {savingId === selectedApplication.id ? "Saving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => updateApplication(selectedApplication.id, { status: "reviewing" })}
                        disabled={savingId === selectedApplication.id}
                        className="ev-button-secondary"
                      >
                        Mark reviewing
                      </button>
                      <button
                        onClick={() =>
                          updateApplication(selectedApplication.id, {
                            status: "rejected",
                            rejection_reason: "Not approved for this operating cycle.",
                          })
                        }
                        disabled={savingId === selectedApplication.id}
                        className="rounded-xl border border-red-400/20 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
