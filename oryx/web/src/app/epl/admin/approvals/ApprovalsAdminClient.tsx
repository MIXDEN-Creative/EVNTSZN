"use client";

import { useEffect, useState } from "react";
import {
  getOperatorRoleOptions,
  getOrganizerClassificationLabel,
  getOrganizerClassificationOptions,
  inferOrganizerClassification,
} from "@/lib/operator-access";

const roleOptions = getOperatorRoleOptions();
const organizerClassificationOptions = getOrganizerClassificationOptions();

export default function ApprovalsAdminClient() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/operator-applications", { cache: "no-store" });
    const data = (await res.json()) as { applications?: any[]; error?: string };
    if (res.ok) {
      setApplications(data.applications || []);
    } else {
      setMessage(data.error || "Could not load applications.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateApplication(applicationId: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/operator-applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "Could not update application.");
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Approvals</div>
            <h1 className="ev-title">Review hosts and organizers before they go live.</h1>
            <p className="ev-subtitle">
              Control who gets ops access, what city they belong to, and whether their inventory can surface on public discovery.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {message}
        </div>
      ) : null}

      <section className="mt-6 ev-panel p-6">
        <div className="ev-section-kicker">Queue</div>
        <h2 className="mt-3 text-2xl font-bold text-white">Onboarding reviews</h2>

        <div className="mt-5 space-y-4">
          {loading ? <div className="text-white/60">Loading applications...</div> : null}
          {!loading && applications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
              No host, organizer, or partner applications are waiting right now.
            </div>
          ) : null}

          {applications.map((application) => (
            <article key={application.id} className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xl font-bold text-white">{application.full_name}</div>
                  <div className="mt-1 text-sm text-white/55">{application.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#c5a2ff]">
                    <span>{application.application_type}</span>
                    <span>{application.status}</span>
                    <span>
                      {getOrganizerClassificationLabel(
                        String(
                          application.organizer_classification ||
                            inferOrganizerClassification(application.requested_role_key || application.application_type),
                        ),
                      )}
                    </span>
                    {application.city ? <span>{application.city}</span> : null}
                  </div>
                  {application.motivation ? (
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72">{application.motivation}</p>
                  ) : null}
                  <div className="mt-4 text-sm leading-6 text-white/60">
                    {String(application.organizer_classification || "").includes("independent")
                      ? "Independent Organizers stay on the external operator track. They can manage their own event activity, but they do not inherit EVNTSZN Host network privileges by default."
                      : "EVNTSZN Host-track applicants move through the network path, which can include city support, host progression, and internal program visibility once approved."}
                  </div>
                </div>

                <div className="grid gap-3 md:min-w-[240px]">
                  <select
                    defaultValue={application.requested_role_key || application.application_type}
                    onChange={(e) => updateApplication(application.id, { status: "reviewing", role_key: e.target.value })}
                    className="rounded-xl border border-white/10 bg-black px-4 py-2 text-sm text-white"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <select
                    defaultValue={
                      application.organizer_classification ||
                      inferOrganizerClassification(application.requested_role_key || application.application_type)
                    }
                    onChange={(e) =>
                      updateApplication(application.id, {
                        status: "reviewing",
                        organizer_classification: e.target.value,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-black px-4 py-2 text-sm text-white"
                  >
                    {organizerClassificationOptions.map((classification) => (
                      <option key={classification.value} value={classification.value}>
                        {classification.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      updateApplication(application.id, {
                        status: "approved",
                        role_key: application.requested_role_key || application.application_type,
                        organizer_classification:
                          application.organizer_classification ||
                          inferOrganizerClassification(application.requested_role_key || application.application_type),
                        discovery_eligible: true,
                      })
                    }
                    className="rounded-xl bg-[#A259FF] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateApplication(application.id, { status: "reviewing" })}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
                  >
                    Mark reviewing
                  </button>
                  <button
                    onClick={() => updateApplication(application.id, { status: "rejected", rejection_reason: "Not approved for this operating cycle." })}
                    className="rounded-xl border border-red-400/20 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
