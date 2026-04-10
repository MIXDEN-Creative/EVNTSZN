"use client";

import { useEffect, useMemo, useState } from "react";

type ApplicationRecord = {
  key: string;
  kind: "operator" | "staffing" | "player" | "program" | "sponsor";
  id: string;
  applicantName: string;
  email: string;
  typeLabel: string;
  linkedRole: string | null;
  city: string | null;
  stage: string;
  status: string | null;
  assignedReviewerUserId: string | null;
  interviewStatus: string | null;
  finalDecision: string | null;
  linkedAccessStatus: string | null;
  linkedStaffAssignmentStatus: string | null;
  notes: string | null;
  submittedAt: string | null;
  ageHours: number;
  priority: string | null;
};

type Reviewer = {
  userId: string;
  name: string;
};

const stageTabs = [
  { key: "all", label: "Overview" },
  { key: "new", label: "New Applications" },
  { key: "in_review", label: "In Review" },
  { key: "interviewing", label: "Interviewing" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "needs_access", label: "Needs Access" },
  { key: "assigned", label: "Assigned" },
  { key: "archived", label: "Archived" },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No timestamp" : date.toLocaleString();
}

function badgeClass(stage: string) {
  if (stage === "approved" || stage === "assigned") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (stage === "rejected") return "border-red-400/25 bg-red-500/10 text-red-200";
  if (stage === "needs_access" || stage === "interviewing") return "border-amber-400/25 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-white/72";
}

function queueOwnerLabel(kind: ApplicationRecord["kind"]) {
  switch (kind) {
    case "operator":
      return "Host + organizer intake";
    case "staffing":
      return "EPL staffing";
    case "player":
      return "Player registrations";
    case "program":
      return "Program applications";
    case "sponsor":
      return "Partner interest";
    default:
      return "Application desk";
  }
}

function reviewerLabel(reviewers: Reviewer[], reviewerId: string | null) {
  if (!reviewerId) return "Unassigned";
  return reviewers.find((reviewer) => reviewer.userId === reviewerId)?.name || "Assigned reviewer";
}

export default function ApprovalsAdminClient() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string>("all");
  const [filters, setFilters] = useState({
    type: "",
    city: "",
    reviewer: "",
    priority: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/application-command-center", { cache: "no-store" });
    const json = (await response.json()) as {
      applications?: ApplicationRecord[];
      reviewers?: Reviewer[];
      error?: string;
    };
    if (!response.ok) {
      setMessage(json.error || "Could not load applications.");
      setLoading(false);
      return;
    }
    const nextApplications = json.applications || [];
    setApplications(nextApplications);
    setReviewers(json.reviewers || []);
    setSelectedKey((current) => current || nextApplications[0]?.key || null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const stageCounts = useMemo(
    () =>
      stageTabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
        count: tab.key === "all" ? applications.length : applications.filter((application) => application.stage === tab.key).length,
      })),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      if (activeStage !== "all" && application.stage !== activeStage) return false;
      if (filters.type && application.typeLabel !== filters.type) return false;
      if (filters.city && application.city !== filters.city) return false;
      if (filters.reviewer && (application.assignedReviewerUserId || "") !== filters.reviewer) return false;
      if (filters.priority && (application.priority || "") !== filters.priority) return false;
      if (!filters.search) return true;
      const haystack = [application.applicantName, application.email, application.typeLabel, application.linkedRole, application.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(filters.search.toLowerCase());
    });
  }, [activeStage, applications, filters]);

  const selectedApplication = useMemo(
    () => filteredApplications.find((application) => application.key === selectedKey) || applications.find((application) => application.key === selectedKey) || null,
    [applications, filteredApplications, selectedKey],
  );

  useEffect(() => {
    setNotesDraft(selectedApplication?.notes || "");
  }, [selectedApplication?.key]);

  async function saveUpdate(payload: Record<string, unknown>) {
    if (!selectedApplication) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/application-command-center", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: selectedApplication.key,
        ...payload,
      }),
    });
    const json = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(json.error || "Could not update application.");
      return;
    }
    setMessage("Application updated.");
    await load();
  }

  const cities = Array.from(new Set(applications.map((application) => application.city).filter(Boolean))) as string[];
  const types = Array.from(new Set(applications.map((application) => application.typeLabel).filter(Boolean))) as string[];

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Application command center</div>
            <h1 className="ev-title">Review applications, move stages, and close access gaps.</h1>
            <p className="ev-subtitle">
              Work host, organizer, staffing, and player intake from one queue. Move each record to the next clear decision instead of hopping between disconnected tools.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stageCounts.slice(1, 5).map((item) => (
              <div key={item.key} className="ev-meta-card">
                <div className="ev-meta-label">{item.label}</div>
                <div className="ev-meta-value">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <section className="ev-panel mt-6 p-5">
        <div className="flex flex-wrap gap-2">
          {stageCounts.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStage(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeStage === tab.key ? "bg-[#A259FF] text-white" : "border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/10"
              }`}
            >
              {tab.label} <span className="ml-1 text-white/55">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <input className="ev-field" placeholder="Search name, email, role, city" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <select className="ev-field" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}>
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.reviewer} onChange={(event) => setFilters((current) => ({ ...current, reviewer: event.target.value }))}>
            <option value="">All reviewers</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer.userId} value={reviewer.userId}>
                {reviewer.name}
              </option>
            ))}
          </select>
          <select className="ev-field" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="ev-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="ev-section-kicker">Queue</div>
              <div className="mt-2 text-xl font-bold text-white">Applications waiting on action</div>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/45">
              {filteredApplications.length}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                </div>
              ))
            ) : null}

            {!loading && !filteredApplications.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                No applications match the current queue.
              </div>
            ) : null}

            {filteredApplications.map((application) => (
              <button
                key={application.key}
                type="button"
                onClick={() => setSelectedKey(application.key)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedKey === application.key ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${badgeClass(application.stage)}`}>
                    {application.stage.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{application.ageHours}h</div>
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{application.applicantName}</div>
                <div className="mt-1 text-sm text-white/55">{application.email}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/48">
                  <span>{queueOwnerLabel(application.kind)}</span>
                  <span>{application.typeLabel}</span>
                  {application.city ? <span>{application.city}</span> : null}
                  {application.linkedRole ? <span>{application.linkedRole}</span> : null}
                  <span>{reviewerLabel(reviewers, application.assignedReviewerUserId)}</span>
                  {application.linkedAccessStatus ? <span>access {application.linkedAccessStatus}</span> : null}
                  {application.linkedStaffAssignmentStatus ? <span>assignment {application.linkedStaffAssignmentStatus}</span> : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ev-panel p-6">
          {!selectedApplication ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">Select an application to review identity, notes, stage, and access readiness.</div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="ev-section-kicker">Application detail</div>
                  <h2 className="mt-3 text-2xl font-bold text-white">{selectedApplication.applicantName}</h2>
                  <div className="mt-2 text-sm text-white/60">{selectedApplication.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                    <span>{selectedApplication.typeLabel}</span>
                    <span>{queueOwnerLabel(selectedApplication.kind)}</span>
                    {selectedApplication.city ? <span>{selectedApplication.city}</span> : null}
                    {selectedApplication.linkedRole ? <span>{selectedApplication.linkedRole}</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/65">
                  Submitted {formatDate(selectedApplication.submittedAt)}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Queue owner</div>
                  <div className="mt-2 text-base font-semibold text-white">{queueOwnerLabel(selectedApplication.kind)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Reviewer</div>
                  <div className="mt-2 text-base font-semibold text-white">{reviewerLabel(reviewers, selectedApplication.assignedReviewerUserId)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Current stage</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedApplication.stage.replace(/_/g, " ")}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Access</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedApplication.linkedAccessStatus || "none"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Assignment</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedApplication.linkedStaffAssignmentStatus || "none"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Interview</div>
                  <div className="mt-2 text-base font-semibold text-white">{selectedApplication.interviewStatus || "not started"}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Stage</label>
                    <select className="ev-field" value={selectedApplication.stage} onChange={(event) => void saveUpdate({ stage: event.target.value })} disabled={saving}>
                      {stageTabs.slice(1).map((tab) => (
                        <option key={tab.key} value={tab.key}>
                          {tab.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Reviewer</label>
                    <select
                      className="ev-field"
                      value={selectedApplication.assignedReviewerUserId || ""}
                      onChange={(event) => void saveUpdate({ assignedReviewerUserId: event.target.value || null })}
                      disabled={saving}
                    >
                      <option value="">Unassigned</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.userId} value={reviewer.userId}>
                          {reviewer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className="ev-button-secondary" onClick={() => void saveUpdate({ stage: "in_review" })} disabled={saving}>
                      Mark in review
                    </button>
                    <button type="button" className="ev-button-secondary" onClick={() => void saveUpdate({ stage: "interviewing" })} disabled={saving}>
                      Move to interview
                    </button>
                    <button type="button" className="ev-button-primary" onClick={() => void saveUpdate({ stage: "approved" })} disabled={saving}>
                      Approve
                    </button>
                    <button type="button" className="rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/10" onClick={() => void saveUpdate({ stage: "rejected" })} disabled={saving}>
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Notes</label>
                  <textarea
                    className="ev-textarea"
                    rows={9}
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    placeholder="Add context, reviewer notes, next step, or access instructions."
                  />
                  <div className="mt-2 text-xs text-white/45">Use notes for decision context, access follow-up, assignment handoff, or reviewer next steps.</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" className="ev-button-primary" onClick={() => void saveUpdate({ notes: notesDraft })} disabled={saving}>
                      Save notes
                    </button>
                    <button type="button" className="ev-button-secondary" onClick={() => setNotesDraft(selectedApplication.notes || "")} disabled={saving}>
                      Reset
                    </button>
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
