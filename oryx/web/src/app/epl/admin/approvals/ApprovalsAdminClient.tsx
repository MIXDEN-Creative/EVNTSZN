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
    <main className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="ev-kicker">Application command center</div>
            <h1 className="ev-title text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">Review registrations & move stages.</h1>
            <p className="ev-subtitle mt-6 text-lg md:text-xl max-w-3xl leading-relaxed text-white/60">
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

      <div className="mt-12 flex flex-col gap-8">
        <section className="ev-panel p-6 md:p-8 sticky top-[80px] z-20 backdrop-blur-3xl bg-black/60">
          <div className="flex flex-wrap gap-2">
            {stageCounts.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStage(tab.key)}
                className={`rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                  activeStage === tab.key ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10"
                }`}
              >
                {tab.label} <span className="ml-1 opacity-40">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <input className="ev-field bg-black/40" placeholder="Search name, email, role..." value={filters.search} onChange={(e) => setFilters(c => ({ ...c, search: e.target.value }))} />
            <select className="ev-field bg-black/40" value={filters.type} onChange={(e) => setFilters(c => ({ ...c, type: e.target.value }))}>
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="ev-field bg-black/40" value={filters.city} onChange={(e) => setFilters(c => ({ ...c, city: e.target.value }))}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="ev-field bg-black/40" value={filters.reviewer} onChange={(e) => setFilters(c => ({ ...c, reviewer: e.target.value }))}>
              <option value="">All Reviewers</option>
              {reviewers.map(r => <option key={r.userId} value={r.userId}>{r.name}</option>)}
            </select>
            <select className="ev-field bg-black/40" value={filters.priority} onChange={(e) => setFilters(c => ({ ...c, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[450px_1fr]">
          {/* Column 1: Queue */}
          <section className="ev-panel p-6 md:p-8 h-fit max-h-[1200px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="ev-section-kicker">Queue</div>
              <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-white/40 tracking-widest">{filteredApplications.length} records</div>
            </div>

            <div className="mt-8 space-y-4">
              {filteredApplications.map((application) => (
                <button
                  key={application.key}
                  type="button"
                  onClick={() => setSelectedKey(application.key)}
                  className={`w-full rounded-[32px] border p-6 text-left transition ${
                    selectedKey === application.key 
                      ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_30px_rgba(162,89,255,0.15)]" 
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${badgeClass(application.stage)}`}>
                      {application.stage.replace(/_/g, " ")}
                    </div>
                    <div className="text-[10px] font-bold text-white/20">{application.ageHours}h</div>
                  </div>
                  <div className="mt-4 text-xl font-bold text-white tracking-tight">{application.applicantName}</div>
                  <div className="mt-1 text-sm text-white/40">{application.email}</div>
                  <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <span className="bg-white/5 px-2 py-1 rounded-lg">{application.typeLabel}</span>
                    {application.city && <span className="bg-white/5 px-2 py-1 rounded-lg">{application.city}</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Column 2: Application Detail */}
          <section className="flex flex-col gap-8">
            {selectedApplication ? (
              <section className="ev-panel p-8 md:p-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between border-b border-white/5 pb-10">
                  <div>
                    <div className="ev-section-kicker">Record context</div>
                    <h2 className="mt-3 text-5xl font-black text-white tracking-tight leading-none">{selectedApplication.applicantName}</h2>
                    <p className="mt-4 text-xl text-white/50">{selectedApplication.email}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <span className="rounded-full bg-[#caa7ff]/10 border border-[#caa7ff]/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#caa7ff]">{selectedApplication.typeLabel}</span>
                      {selectedApplication.city && <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/40">{selectedApplication.city}</span>}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-8 text-center min-w-[240px]">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Submitted At</div>
                    <div className="mt-2 text-sm font-bold text-white">{formatDate(selectedApplication.submittedAt)}</div>
                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]">Age: {selectedApplication.ageHours} Hours</div>
                  </div>
                </div>

                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {[
                    ["Queue Owner", queueOwnerLabel(selectedApplication.kind)],
                    ["Reviewer", reviewerLabel(reviewers, selectedApplication.assignedReviewerUserId)],
                    ["Current Stage", selectedApplication.stage.replace(/_/g, " ")],
                    ["Access Status", selectedApplication.linkedAccessStatus || "none"],
                    ["Assignment", selectedApplication.linkedStaffAssignmentStatus || "none"],
                    ["Priority", selectedApplication.priority || "normal"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-3xl border border-white/5 bg-black/40 p-6 transition hover:bg-black/60">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</div>
                      <div className="mt-2 text-sm font-bold text-white uppercase tracking-tight">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 grid gap-12 xl:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-10">
                    <div>
                      <div className="ev-section-kicker">State Management</div>
                      <div className="mt-6 grid gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Move to Stage</label>
                          <select className="ev-field h-14 text-base" value={selectedApplication.stage} onChange={(e) => void saveUpdate({ stage: e.target.value })} disabled={saving}>
                            {stageTabs.slice(1).map(tab => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Assign Reviewer</label>
                          <select className="ev-field h-14 text-base" value={selectedApplication.assignedReviewerUserId || ""} onChange={(e) => void saveUpdate({ assignedReviewerUserId: e.target.value || null })} disabled={saving}>
                            <option value="">Unassigned</option>
                            {reviewers.map(r => <option key={r.userId} value={r.userId}>{r.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="ev-section-kicker">Quick Decisions</div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <button type="button" className="ev-button-secondary py-4 font-black tracking-widest text-[11px] uppercase" onClick={() => void saveUpdate({ stage: "in_review" })} disabled={saving}>Mark In Review</button>
                        <button type="button" className="ev-button-secondary py-4 font-black tracking-widest text-[11px] uppercase" onClick={() => void saveUpdate({ stage: "interviewing" })} disabled={saving}>Move to Interview</button>
                        <button type="button" className="ev-button-primary py-4 font-black tracking-widest text-[11px] uppercase bg-emerald-500 text-black hover:bg-emerald-400" onClick={() => void saveUpdate({ stage: "approved" })} disabled={saving}>Approve Entry</button>
                        <button type="button" className="rounded-[20px] border border-red-500/20 bg-red-500/5 py-4 font-black tracking-widest text-[11px] uppercase text-red-400 hover:bg-red-500/10" onClick={() => void saveUpdate({ stage: "rejected" })} disabled={saving}>Reject Entry</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full rounded-[40px] border border-white/10 bg-white/[0.02] p-8 lg:p-10">
                    <div className="ev-section-kicker">Internal Handoff & Notes</div>
                    <textarea
                      className="ev-textarea mt-6 bg-black/40 flex-1 min-h-[300px] text-base leading-relaxed"
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Add context, decision logic, or access instructions for the next operator..."
                    />
                    <div className="mt-8 flex gap-4">
                      <button type="button" className="ev-button-primary px-10 py-4 font-black tracking-widest text-[11px] uppercase" onClick={() => void saveUpdate({ notes: notesDraft })} disabled={saving}>Save internal notes</button>
                      <button type="button" className="ev-button-secondary px-8 py-4 font-black tracking-widest text-[11px] uppercase" onClick={() => setNotesDraft(selectedApplication.notes || "")} disabled={saving}>Reset</button>
                    </div>
                    <p className="mt-6 text-[10px] text-white/30 uppercase tracking-[0.25em] text-center font-bold">Visibility: Internal workforce only</p>
                  </div>
                </div>
              </section>
            ) : (
              <div className="h-full min-h-[600px] flex items-center justify-center rounded-[48px] border border-dashed border-white/10 bg-white/[0.01] p-12 text-center text-white/20">
                <div className="max-w-md">
                  <div className="text-2xl font-black tracking-tight text-white/40">No application selected.</div>
                  <p className="mt-4 text-lg leading-relaxed">Select a record from the queue to review identity, internal notes, and move the application through the intake pipeline.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
