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
    <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid lg:grid-cols-[1.2fr_0.8fr] 2xl:grid-cols-[1.3fr_0.7fr]">
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
                <div className="ev-meta-value font-bold">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <section className="ev-panel mt-8 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {stageCounts.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStage(tab.key)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition ${
                activeStage === tab.key ? "bg-[#A259FF] text-white" : "border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/10"
              }`}
            >
              {tab.label} <span className="ml-1 text-white/40">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <input className="ev-field h-11" placeholder="Search name, email, role, city" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <select className="ev-field h-11" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select className="ev-field h-11" value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}>
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select className="ev-field h-11" value={filters.reviewer} onChange={(event) => setFilters((current) => ({ ...current, reviewer: event.target.value }))}>
            <option value="">All reviewers</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer.userId} value={reviewer.userId}>
                {reviewer.name}
              </option>
            ))}
          </select>
          <select className="ev-field h-11" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[400px_1fr] 2xl:grid-cols-[440px_1fr]">
        <section className="ev-panel p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="ev-section-kicker">Queue</div>
              <div className="mt-2 text-2xl font-black text-white tracking-tight">Pending action</div>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/5">
              {filteredApplications.length}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-black/30 p-6">
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                  <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                </div>
              ))
            ) : null}

            {!loading && !filteredApplications.length ? (
              <div className="rounded-[32px] border border-dashed border-white/12 bg-white/[0.01] p-10 text-center text-sm text-white/40">
                No applications match the current queue.
              </div>
            ) : null}

            {filteredApplications.map((application) => (
              <button
                key={application.key}
                type="button"
                onClick={() => setSelectedKey(application.key)}
                className={`w-full rounded-[32px] border p-6 text-left transition ${
                  selectedKey === application.key ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-2xl" : "border-white/10 bg-black/30 hover:bg-white/[0.04] hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${badgeClass(application.stage)}`}>
                    {application.stage.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{application.ageHours}h</div>
                </div>
                <div className="mt-4 text-xl font-bold text-white tracking-tight">{application.applicantName}</div>
                <div className="mt-1 text-sm text-white/50">{application.email}</div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  <span className="bg-white/5 px-2 py-1 rounded">{queueOwnerLabel(application.kind)}</span>
                  <span className="bg-white/5 px-2 py-1 rounded">{application.typeLabel}</span>
                  {application.city ? <span className="bg-white/5 px-2 py-1 rounded">{application.city}</span> : null}
                  {application.linkedRole ? <span className="bg-white/5 px-2 py-1 rounded">{application.linkedRole}</span> : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ev-panel p-8 md:p-10 lg:p-12">
          {!selectedApplication ? (
            <div className="h-full flex items-center justify-center rounded-[40px] border border-dashed border-white/12 bg-white/[0.01] p-12 text-center text-white/40">
              <div className="max-w-xs">
                <div className="text-lg font-bold text-white/60">No selection</div>
                <p className="mt-2 text-sm">Select an application to review identity, notes, stage, and access readiness.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="ev-section-kicker">Application detail</div>
                  <h2 className="mt-3 text-4xl font-black text-white tracking-tight leading-none">{selectedApplication.applicantName}</h2>
                  <div className="mt-3 text-lg text-white/50">{selectedApplication.email}</div>
                  <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#caa7ff]">
                    <span className="bg-[#caa7ff]/10 px-3 py-1.5 rounded-full">{selectedApplication.typeLabel}</span>
                    <span className="bg-white/5 px-3 py-1.5 rounded-full">{queueOwnerLabel(selectedApplication.kind)}</span>
                    {selectedApplication.city ? <span className="bg-white/5 px-3 py-1.5 rounded-full">{selectedApplication.city}</span> : null}
                    {selectedApplication.linkedRole ? <span className="bg-white/5 px-3 py-1.5 rounded-full">{selectedApplication.linkedRole}</span> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm font-medium text-white/60 whitespace-nowrap">
                  Submitted {formatDate(selectedApplication.submittedAt)}
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Queue owner", queueOwnerLabel(selectedApplication.kind)],
                  ["Reviewer", reviewerLabel(reviewers, selectedApplication.assignedReviewerUserId)],
                  ["Current stage", selectedApplication.stage.replace(/_/g, " ")],
                  ["Access", selectedApplication.linkedAccessStatus || "none"],
                  ["Assignment", selectedApplication.linkedStaffAssignmentStatus || "none"],
                  ["Interview", selectedApplication.interviewStatus || "not started"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
                    <div className="mt-2 text-base font-bold text-white tracking-tight">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-8">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                    <div>
                      <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.22em] text-white/30">Move stage</label>
                      <select className="ev-field h-12" value={selectedApplication.stage} onChange={(event) => void saveUpdate({ stage: event.target.value })} disabled={saving}>
                        {stageTabs.slice(1).map((tab) => (
                          <option key={tab.key} value={tab.key}>
                            {tab.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.22em] text-white/30">Assign Reviewer</label>
                      <select
                        className="ev-field h-12"
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
                  </div>
                  
                  <div>
                    <label className="mb-4 block text-[11px] font-black uppercase tracking-[0.22em] text-white/30">Quick actions</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" className="ev-button-secondary h-12" onClick={() => void saveUpdate({ stage: "in_review" })} disabled={saving}>
                        Mark in review
                      </button>
                      <button type="button" className="ev-button-secondary h-12" onClick={() => void saveUpdate({ stage: "interviewing" })} disabled={saving}>
                        Move to interview
                      </button>
                      <button type="button" className="ev-button-primary h-12" onClick={() => void saveUpdate({ stage: "approved" })} disabled={saving}>
                        Approve
                      </button>
                      <button type="button" className="rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm font-bold text-red-200 hover:bg-red-500/10 transition-colors" onClick={() => void saveUpdate({ stage: "rejected" })} disabled={saving}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.22em] text-white/30">Internal Handoff & Reviewer Notes</label>
                  <textarea
                    className="ev-textarea bg-black/40 min-h-[240px]"
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    placeholder="Add context, reviewer notes, next step, or access instructions."
                  />
                  <p className="mt-3 text-xs leading-relaxed text-white/40">Use notes for decision context, access follow-up, assignment handoff, or reviewer next steps. All internal staff with permissions can see these notes.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" className="ev-button-primary px-8" onClick={() => void saveUpdate({ notes: notesDraft })} disabled={saving}>
                      Save notes
                    </button>
                    <button type="button" className="ev-button-secondary px-8" onClick={() => setNotesDraft(selectedApplication.notes || "")} disabled={saving}>
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
