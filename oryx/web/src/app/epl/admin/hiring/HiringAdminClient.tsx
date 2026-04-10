"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS } from "@/lib/city-options";

const statusOptions = [
  "submitted",
  "under review",
  "shortlisted",
  "zoom interview assigned",
  "zoom completed",
  "advanced to phone interview",
  "phone interview assigned",
  "phone interview completed",
  "hired",
  "not selected",
  "archived",
];
const citySuggestions = INTERNAL_CITY_OPTIONS;

function buildGoogleCalendarUrl({
  stage,
  title,
  scheduledAt,
}: {
  stage: string;
  title: string;
  scheduledAt?: string;
}) {
  if (!scheduledAt) return "";
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const format = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${stage === "phone" ? "Phone" : "Zoom"} interview · ${title}`,
    dates: `${format(start)}/${format(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function HiringAdminClient() {
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ query: "", status: "", type: "" });
  const [interviewForm, setInterviewForm] = useState({
    id: "",
    interview_stage: "zoom",
    status: "scheduled",
    interviewer_user_id: "",
    interviewer_name: "",
    scheduled_at: "",
    recommendation: "",
    summary: "",
    notes: "",
  });
  const [conversionForm, setConversionForm] = useState({
    roleKey: "operations_coordinator",
    jobTitle: "",
    functions: "epl, staffing",
    cityScope: "Baltimore",
    dashboardAccess: "admin",
    surfaceAccess: "admin",
    moduleAccess: "epl, staffing",
    canAccessScanner: false,
  });

  async function load() {
    const [appsRes, interviewsRes] = await Promise.all([
      fetch("/api/epl/admin/staff-applications?seasonSlug=season-1", { cache: "no-store" }),
      fetch("/api/epl/admin/interviews", { cache: "no-store" }),
    ]);
    const appsJson = (await appsRes.json()) as { applications?: any[]; error?: string };
    const interviewsJson = (await interviewsRes.json()) as { interviews?: any[]; interviewers?: any[]; error?: string };
    if (!appsRes.ok) {
      setMessage(appsJson.error || "Could not load applications.");
      return;
    }
    if (!interviewsRes.ok) {
      setMessage(interviewsJson.error || "Could not load interviews.");
      return;
    }
    const nextApps = appsJson.applications || [];
    setApplications(nextApps);
    setInterviews(interviewsJson.interviews || []);
    setInterviewers(interviewsJson.interviewers || []);
    if (!selectedId && nextApps[0]?.id) setSelectedId(nextApps[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const haystack = [
        application.first_name,
        application.last_name,
        application.email,
        application.opportunity_title,
        application.city,
        application.opportunity_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const queryMatch = !filters.query || haystack.includes(filters.query.toLowerCase());
      const statusMatch = !filters.status || String(application.status || "").toLowerCase() === filters.status.toLowerCase();
      const typeMatch = !filters.type || String(application.opportunity_type || "").toLowerCase() === filters.type.toLowerCase();
      return queryMatch && statusMatch && typeMatch;
    });
  }, [applications, filters]);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) || null,
    [applications, selectedId],
  );

  const selectedInterviews = useMemo(
    () => interviews.filter((interview) => interview.application_id === selectedId),
    [interviews, selectedId],
  );

  useEffect(() => {
    if (!selectedApplication) return;
    setConversionForm((current) => ({
      ...current,
      jobTitle: current.jobTitle || selectedApplication.opportunity_title || "EPL Operations",
      cityScope: current.cityScope || selectedApplication.city || "Baltimore",
    }));
  }, [selectedApplication]);

  async function updateApplication(payload: Record<string, unknown>) {
    if (!selectedApplication) return;
    const res = await fetch("/api/epl/admin/staff-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedApplication.id,
        ...payload,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update application.");
      return;
    }
    setMessage("Application updated.");
    await load();
  }

  async function saveInterview(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedApplication) return;
    const selectedInterviewer = interviewers.find((row) => row.user_id === interviewForm.interviewer_user_id);
    const res = await fetch("/api/epl/admin/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...interviewForm,
        application_id: selectedApplication.id,
        interviewer_name:
          interviewForm.interviewer_name ||
          selectedInterviewer?.evntszn_profiles?.full_name ||
          selectedInterviewer?.job_title ||
          "",
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save interview.");
      return;
    }
    setMessage("Interview record updated.");
    setInterviewForm({
      id: "",
      interview_stage: "zoom",
      status: "scheduled",
      interviewer_user_id: "",
      interviewer_name: "",
      scheduled_at: "",
      recommendation: "",
      summary: "",
      notes: "",
    });
    await load();
  }

  async function convertToUser() {
    if (!selectedApplication) return;
    const res = await fetch("/api/epl/admin/staff-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "convertToUser",
        id: selectedApplication.id,
        roleKey: conversionForm.roleKey,
        jobTitle: conversionForm.jobTitle,
        functions: conversionForm.functions.split(",").map((item) => item.trim()).filter(Boolean),
        cityScope: conversionForm.cityScope.split(",").map((item) => item.trim()).filter(Boolean),
        dashboardAccess: conversionForm.dashboardAccess.split(",").map((item) => item.trim()).filter(Boolean),
        surfaceAccess: conversionForm.surfaceAccess.split(",").map((item) => item.trim()).filter(Boolean),
        moduleAccess: conversionForm.moduleAccess.split(",").map((item) => item.trim()).filter(Boolean),
        canAccessScanner: conversionForm.canAccessScanner,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not convert hired applicant into a user.");
      return;
    }
    setMessage("Hired applicant converted into a managed user.");
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Hiring pipeline</div>
            <h1 className="ev-title">Review, interview, and hire EPL operators without leaving the dashboard.</h1>
            <p className="ev-subtitle">
              Manage the full flow from application intake through Zoom, phone follow-up, and hire or no-hire decisions, then convert successful applicants into platform users with the right access.
            </p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <section className="mt-6 ev-panel p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <input className="ev-field" placeholder="Search applicants or roles" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} />
          <select className="ev-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="ev-field" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Paid + volunteer</option>
            <option value="paid">Paid</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Applications</div>
          <div className="mt-4 space-y-3">
            {filteredApplications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedId(application.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  application.id === selectedId ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                }`}
              >
                <div className="text-sm uppercase tracking-[0.18em] text-[#caa7ff]">{application.opportunity_type || "role"}</div>
                <div className="mt-2 text-lg font-semibold text-white">{application.first_name} {application.last_name}</div>
                <div className="mt-1 text-sm text-white/55">{application.opportunity_title || "General EPL application"}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">{application.status}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          {!selectedApplication ? (
            <section className="ev-panel p-6 text-white/60">Select an application to review the pipeline.</section>
          ) : (
            <>
              <section className="ev-panel p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="ev-section-kicker">Applicant detail</div>
                    <h2 className="mt-3 text-2xl font-bold text-white">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </h2>
                    <div className="mt-2 text-sm text-white/55">
                      {selectedApplication.email} {selectedApplication.phone ? `• ${selectedApplication.phone}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                      <span>{selectedApplication.opportunity_title || "General EPL role"}</span>
                      <span>{selectedApplication.status}</span>
                      {selectedApplication.city ? <span>{selectedApplication.city}</span> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:min-w-[260px]">
                    <select
                      className="ev-field"
                      value={selectedApplication.status || "submitted"}
                      onChange={(e) => updateApplication({ status: e.target.value })}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <button className="ev-button-secondary" onClick={() => updateApplication({ status: "under review" })}>
                      Mark under review
                    </button>
                    <button className="ev-button-secondary" onClick={() => updateApplication({ status: "advanced to phone interview", interviewStage: "phone" })}>
                      Advance to phone stage
                    </button>
                    <button className="ev-button-primary" onClick={() => updateApplication({ status: "not selected", hiringDecision: "not_selected" })}>
                      Mark not selected
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <textarea
                    className="ev-textarea"
                    rows={4}
                    defaultValue={selectedApplication.internal_notes || ""}
                    placeholder="Internal notes"
                    onBlur={(e) => updateApplication({ internalNotes: e.target.value })}
                  />
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/72">
                    <div><strong>Experience:</strong> {selectedApplication.experience_summary || "Not provided."}</div>
                    <div><strong>Availability:</strong> {selectedApplication.availability_summary || "Not provided."}</div>
                    <div><strong>Why join:</strong> {selectedApplication.why_join || "Not provided."}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>Resume:</strong>
                      {selectedApplication.resume_url ? (
                        <a href={selectedApplication.resume_url} target="_blank" rel="noreferrer" className="text-[#d8c2ff] underline-offset-4 hover:underline">
                          Open resume URL
                        </a>
                      ) : (
                        <span>Not provided.</span>
                      )}
                      {selectedApplication.source_metadata?.resumeStoragePath ? (
                        <a href={`/api/epl/admin/staff-applications/resume/${selectedApplication.id}`} className="text-[#d8c2ff] underline-offset-4 hover:underline">
                          Open uploaded resume
                        </a>
                      ) : null}
                    </div>
                    <div><strong>Portfolio:</strong> {selectedApplication.portfolio_url || "Not provided."}</div>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="ev-panel p-6">
                  <div className="ev-section-kicker">Interview history</div>
                  <div className="mt-5 space-y-3">
                    {selectedInterviews.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                        No interview records yet for this applicant.
                      </div>
                    ) : (
                      selectedInterviews.map((interview) => (
                        <button
                          key={interview.id}
                          type="button"
                          onClick={() =>
                            setInterviewForm({
                              id: interview.id,
                              interview_stage: interview.interview_stage || "zoom",
                              status: interview.status || "scheduled",
                              interviewer_user_id: interview.interviewer_user_id || "",
                              interviewer_name: interview.interviewer_name || "",
                              scheduled_at: interview.scheduled_at ? String(interview.scheduled_at).slice(0, 16) : "",
                              recommendation: interview.recommendation || "",
                              summary: interview.summary || "",
                              notes: interview.notes || "",
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left"
                        >
                          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                            <span>{interview.interview_stage}</span>
                            <span>{interview.status}</span>
                            {interview.recommendation ? <span>{interview.recommendation}</span> : null}
                          </div>
                          <div className="mt-2 text-base font-semibold text-white">{interview.interviewer_name || "Assigned interviewer pending"}</div>
                          <div className="mt-1 text-sm text-white/55">{interview.summary || "Open to review or add notes."}</div>
                          {interview.scheduled_at ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                              <a
                                href={buildGoogleCalendarUrl({
                                  stage: interview.interview_stage || "zoom",
                                  title: `${selectedApplication.first_name} ${selectedApplication.last_name}`,
                                  scheduledAt: interview.scheduled_at,
                                })}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-[#d8c2ff] underline-offset-4 hover:underline"
                              >
                                Add to Google Calendar
                              </a>
                            </div>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <form onSubmit={saveInterview} className="ev-panel p-6">
                  <div className="ev-section-kicker">Interview editor</div>
                  <h3 className="mt-3 text-xl font-bold text-white">Assign Zoom or phone interview</h3>
                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <select className="ev-field" value={interviewForm.interview_stage} onChange={(e) => setInterviewForm({ ...interviewForm, interview_stage: e.target.value })}>
                        <option value="zoom">Zoom interview</option>
                        <option value="phone">Phone interview</option>
                      </select>
                      <select className="ev-field" value={interviewForm.status} onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })}>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                    <select className="ev-field" value={interviewForm.interviewer_user_id} onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_user_id: e.target.value })}>
                      <option value="">Assign interviewer</option>
                      {interviewers.map((interviewer) => (
                        <option key={interviewer.user_id} value={interviewer.user_id}>
                          {interviewer.evntszn_profiles?.full_name || interviewer.user_id} · {interviewer.job_title || interviewer.role_key}
                        </option>
                      ))}
                    </select>
                    <input className="ev-field" type="datetime-local" value={interviewForm.scheduled_at} onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })} />
                    {interviewForm.scheduled_at ? (
                      <a
                        href={buildGoogleCalendarUrl({
                          stage: interviewForm.interview_stage,
                          title: `${selectedApplication.first_name} ${selectedApplication.last_name}`,
                          scheduledAt: interviewForm.scheduled_at,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-[#d8c2ff] underline-offset-4 hover:underline"
                      >
                        Open a Google Calendar draft for this interview
                      </a>
                    ) : null}
                    <input className="ev-field" placeholder="Recommendation" value={interviewForm.recommendation} onChange={(e) => setInterviewForm({ ...interviewForm, recommendation: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} placeholder="Summary" value={interviewForm.summary} onChange={(e) => setInterviewForm({ ...interviewForm, summary: e.target.value })} />
                    <textarea className="ev-textarea" rows={5} placeholder="Notes" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
                    <button type="submit" className="ev-button-primary">
                      {interviewForm.id ? "Update interview" : "Create interview"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="ev-panel p-6">
                <div className="ev-section-kicker">Hire flow</div>
                <h3 className="mt-3 text-xl font-bold text-white">Convert a hired applicant into a managed operator</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <select className="ev-field" value={conversionForm.roleKey} onChange={(e) => setConversionForm({ ...conversionForm, roleKey: e.target.value })}>
                    <option value="operations_coordinator">Operations Coordinator</option>
                    <option value="partnerships_manager">Partnerships Manager</option>
                    <option value="audience_growth_manager">Audience & Growth Manager</option>
                    <option value="scanner_staff">Scanner Staff</option>
                    <option value="epl_operator">EPL Operator</option>
                  </select>
                  <input className="ev-field" placeholder="Job title" value={conversionForm.jobTitle} onChange={(e) => setConversionForm({ ...conversionForm, jobTitle: e.target.value })} />
                  <input className="ev-field" placeholder="Functions" value={conversionForm.functions} onChange={(e) => setConversionForm({ ...conversionForm, functions: e.target.value })} />
                  <input className="ev-field" list="staffing-hiring-city-options" placeholder="City scope" value={conversionForm.cityScope} onChange={(e) => setConversionForm({ ...conversionForm, cityScope: e.target.value })} />
                  <input className="ev-field" placeholder="Dashboard access" value={conversionForm.dashboardAccess} onChange={(e) => setConversionForm({ ...conversionForm, dashboardAccess: e.target.value })} />
                  <input className="ev-field" placeholder="Surface access" value={conversionForm.surfaceAccess} onChange={(e) => setConversionForm({ ...conversionForm, surfaceAccess: e.target.value })} />
                  <input className="ev-field md:col-span-2" placeholder="Module access" value={conversionForm.moduleAccess} onChange={(e) => setConversionForm({ ...conversionForm, moduleAccess: e.target.value })} />
                </div>
                <label className="mt-4 flex items-center gap-3 text-sm text-white/75">
                  <input type="checkbox" checked={conversionForm.canAccessScanner} onChange={(e) => setConversionForm({ ...conversionForm, canAccessScanner: e.target.checked })} />
                  Grant scanner capability on conversion
                </label>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="ev-button-primary" onClick={convertToUser}>
                    Mark hired and create user
                  </button>
                  <button className="ev-button-secondary" onClick={() => updateApplication({ status: "hired", hiringDecision: "hired" })}>
                    Mark hired only
                  </button>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
      <datalist id="staffing-hiring-city-options">
        {citySuggestions.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </main>
  );
}
