"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INTERNAL_CITY_OPTIONS, getCityStateCode } from "@/lib/city-options";

type AccessRole = {
  id: string;
  name: string;
  primary_role?: string | null;
  role_subtype?: string | null;
};

type StaffUser = {
  user_id: string;
  full_name: string | null;
  city: string | null;
  state: string | null;
  primary_role: string | null;
};

type Template = {
  id: string;
  title: string;
  role_code: string | null;
  department: string | null;
  role_type: "paid" | "volunteer";
  summary: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  default_access_role_id: string | null;
  default_assignment_permission_codes: string[] | null;
  default_operational_tags: string[] | null;
  volunteer_perks: string[] | null;
  pay_amount: number | null;
  pay_type: string | null;
  employment_status: string | null;
  access_track: string | null;
  is_active: boolean;
  sort_order: number;
  roles?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
};

type Position = {
  id: string;
  role_template_id: string;
  title_override: string | null;
  season_id: string | null;
  city: string | null;
  state: string | null;
  position_status: string;
  visibility: "public" | "internal_only";
  slots_needed: number;
  slots_filled: number;
  priority: number;
  notes: string | null;
  publicly_listed: boolean;
  starts_at: string | null;
  ends_at: string | null;
  access_role_id: string | null;
  assignment_permission_codes: string[] | null;
  onboarding_notes: string | null;
  volunteer_perks: string[] | null;
  pay_amount: number | null;
  pay_type: string | null;
  employment_status: string | null;
  access_track: string | null;
  staff_role_templates?: Template | Template[] | null;
  seasons?: { id: string; name?: string | null; slug?: string | null } | { id: string; name?: string | null; slug?: string | null }[] | null;
  evntszn_events?: { id: string; title?: string | null; city?: string | null; slug?: string | null } | { id: string; title?: string | null; city?: string | null; slug?: string | null }[] | null;
  roles?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
};

type Assignment = {
  id: string;
  position_id: string;
  user_id: string | null;
  application_id: string | null;
  assignment_status: string;
  notes: string | null;
  assigned_at: string | null;
  staff_positions?: {
    id: string;
    title_override?: string | null;
    city?: string | null;
    position_status?: string | null;
    staff_role_templates?: { title?: string | null; role_type?: string | null } | { title?: string | null; role_type?: string | null }[] | null;
  } | null;
  evntszn_profiles?: { user_id?: string | null; full_name?: string | null; city?: string | null } | { user_id?: string | null; full_name?: string | null; city?: string | null }[] | null;
  staff_applications?: { id?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null; status?: string | null } | { id?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null; status?: string | null }[] | null;
};

type Applicant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  city: string | null;
  state: string | null;
  preferred_roles: string[] | null;
  opportunity_id?: string | null;
  position_id?: string | null;
  role_template_id?: string | null;
  created_at: string;
};

type Season = {
  id: string;
  name: string;
  slug: string;
};

type EventOption = {
  id: string;
  title: string;
  city: string | null;
  slug: string;
  start_at?: string | null;
};

type ApiPayload = {
  templates?: Template[];
  positions?: Position[];
  assignments?: Assignment[];
  applicants?: Applicant[];
  seasons?: Season[];
  accessRoles?: AccessRole[];
  events?: EventOption[];
  users?: StaffUser[];
  volunteerPerks?: string[];
  error?: string;
};

type PlayerApplicationRecord = {
  key: string;
  applicantName: string;
  email: string;
  stage: string;
  status: string | null;
  city: string | null;
  submittedAt: string | null;
  notes: string | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function joinLines(value: string[] | null | undefined) {
  return (value || []).join("\n");
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function compensationLabel(position: Position, template: Template | null) {
  if ((template?.role_type || "volunteer") !== "paid") return "Volunteer";
  const amount = position.pay_amount ?? template?.pay_amount;
  const payType = position.pay_type || template?.pay_type;
  const employment = position.employment_status || template?.employment_status;
  return [amount ? `$${amount}` : null, payType?.replace(/_/g, " "), employment?.replace(/_/g, " ")]
    .filter(Boolean)
    .join(" • ") || "Paid role";
}

export default function OpportunitiesAdminClient() {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "open_positions" | "assignments" | "applicants" | "public_listings" | "player_applications">("open_positions");
  const [detailTab, setDetailTab] = useState<"overview" | "public_listing" | "assignments" | "access" | "notes">("overview");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [accessRoles, setAccessRoles] = useState<AccessRole[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [volunteerPerks, setVolunteerPerks] = useState<string[]>([]);
  const [playerApplications, setPlayerApplications] = useState<PlayerApplicationRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [selectedPlayerApplicationKey, setSelectedPlayerApplicationKey] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [templateForm, setTemplateForm] = useState<Record<string, any>>({
    title: "",
    roleCode: "",
    department: "Operations",
    roleType: "volunteer",
    summary: "",
    responsibilities: "",
    requirements: "",
    defaultAccessRoleId: "",
    defaultAssignmentPermissionCodes: "",
    defaultOperationalTags: "",
    volunteerPerks: [] as string[],
    payAmount: "",
    payType: "",
    employmentStatus: "",
    accessTrack: "none",
    isActive: true,
    sortOrder: 100,
  });
  const [positionForm, setPositionForm] = useState<Record<string, any>>({
    roleTemplateId: "",
    titleOverride: "",
    seasonId: "",
    eventId: "",
    city: "Baltimore",
    state: "MD",
    positionStatus: "open",
    visibility: "public",
    slotsNeeded: 2,
    slotsFilled: 0,
    priority: 100,
    notes: "",
    publiclyListed: true,
    startsAt: "",
    endsAt: "",
    accessRoleId: "",
    assignmentPermissionCodes: "",
    onboardingNotes: "",
    volunteerPerks: [] as string[],
    payAmount: "",
    payType: "",
    employmentStatus: "",
    accessTrack: "none",
  });
  const [assignmentForm, setAssignmentForm] = useState<Record<string, any>>({
    id: "",
    positionId: "",
    userId: "",
    applicationId: "",
    assignmentStatus: "pending",
    notes: "",
  });

  async function load() {
    const res = await fetch("/api/epl/admin/opportunities", { cache: "no-store" });
    const json = (await res.json()) as ApiPayload;
    if (!res.ok) {
      setMessage(json.error || "Could not load staffing command center.");
      return;
    }

    const nextTemplates = json.templates || [];
    const nextPositions = json.positions || [];
    const nextAssignments = json.assignments || [];
    const nextApplicants = json.applicants || [];

    setTemplates(nextTemplates);
    setPositions(nextPositions);
    setAssignments(nextAssignments);
    setApplicants(nextApplicants);
    setSeasons(json.seasons || []);
    setAccessRoles(json.accessRoles || []);
    setEvents(json.events || []);
    setUsers(json.users || []);
    setVolunteerPerks(json.volunteerPerks || []);
    try {
      const approvalsRes = await fetch("/api/admin/application-command-center", { cache: "no-store" });
      const approvalsJson = (await approvalsRes.json()) as { applications?: any[] };
      if (approvalsRes.ok) {
        const nextPlayerApplications = (approvalsJson.applications || [])
          .filter((application) => application.kind === "player")
          .map((application) => ({
            key: application.key,
            applicantName: application.applicantName,
            email: application.email,
            stage: application.stage,
            status: application.status,
            city: application.city,
            submittedAt: application.submittedAt,
            notes: application.notes,
          }));
        setPlayerApplications(nextPlayerApplications);
        if (!selectedPlayerApplicationKey && nextPlayerApplications[0]?.key) {
          setSelectedPlayerApplicationKey(nextPlayerApplications[0].key);
        }
      }
    } catch {}

    if (!selectedTemplateId && nextTemplates[0]?.id) setSelectedTemplateId(nextTemplates[0].id);
    if (!selectedPositionId && nextPositions[0]?.id) setSelectedPositionId(nextPositions[0].id);
    if (!selectedAssignmentId && nextAssignments[0]?.id) setSelectedAssignmentId(nextAssignments[0].id);
    if (!selectedApplicantId && nextApplicants[0]?.id) setSelectedApplicantId(nextApplicants[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        if (templateFilter === "paid" && template.role_type !== "paid") return false;
        if (templateFilter === "volunteer" && template.role_type !== "volunteer") return false;
        if (templateFilter === "active" && !template.is_active) return false;
        if (templateFilter === "inactive" && template.is_active) return false;
        if (departmentFilter !== "all" && template.department !== departmentFilter) return false;
        return true;
      }),
    [departmentFilter, templateFilter, templates],
  );

  const visiblePositions = useMemo(() => {
    const base = positions.filter((position) => {
      if (activeTab === "public_listings" && (!position.publicly_listed || position.visibility !== "public")) return false;
      if (positionFilter !== "all" && position.position_status !== positionFilter) return false;
      return true;
    });
    return base;
  }, [activeTab, positionFilter, positions]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || null;
  const selectedPosition = positions.find((position) => position.id === selectedPositionId) || null;
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId) || null;
  const selectedApplicant = applicants.find((applicant) => applicant.id === selectedApplicantId) || null;
  const selectedPlayerApplication = playerApplications.find((application) => application.key === selectedPlayerApplicationKey) || null;

  useEffect(() => {
    if (!selectedTemplate) return;
    setTemplateForm({
      id: selectedTemplate.id,
      title: selectedTemplate.title || "",
      roleCode: selectedTemplate.role_code || "",
      department: selectedTemplate.department || "Operations",
      roleType: selectedTemplate.role_type || "volunteer",
      summary: selectedTemplate.summary || "",
      responsibilities: joinLines(selectedTemplate.responsibilities),
      requirements: joinLines(selectedTemplate.requirements),
      defaultAccessRoleId: selectedTemplate.default_access_role_id || "",
      defaultAssignmentPermissionCodes: (selectedTemplate.default_assignment_permission_codes || []).join(", "),
      defaultOperationalTags: (selectedTemplate.default_operational_tags || []).join(", "),
      volunteerPerks: selectedTemplate.volunteer_perks || [],
      payAmount: selectedTemplate.pay_amount || "",
      payType: selectedTemplate.pay_type || "",
      employmentStatus: selectedTemplate.employment_status || "",
      accessTrack: selectedTemplate.access_track || "none",
      isActive: selectedTemplate.is_active,
      sortOrder: selectedTemplate.sort_order || 100,
    });
  }, [selectedTemplate]);

  useEffect(() => {
    if (!selectedPosition) return;
    const template = unwrapOne(selectedPosition.staff_role_templates);
    setPositionForm({
      id: selectedPosition.id,
      roleTemplateId: selectedPosition.role_template_id || "",
      titleOverride: selectedPosition.title_override || "",
      seasonId: selectedPosition.season_id || "",
      eventId: unwrapOne(selectedPosition.evntszn_events)?.id || "",
      city: selectedPosition.city || "",
      state: selectedPosition.state || "",
      positionStatus: selectedPosition.position_status || "open",
      visibility: selectedPosition.visibility || "public",
      slotsNeeded: selectedPosition.slots_needed || 1,
      slotsFilled: selectedPosition.slots_filled || 0,
      priority: selectedPosition.priority || 100,
      notes: selectedPosition.notes || "",
      publiclyListed: selectedPosition.publicly_listed !== false,
      startsAt: selectedPosition.starts_at || "",
      endsAt: selectedPosition.ends_at || "",
      accessRoleId: selectedPosition.access_role_id || template?.default_access_role_id || "",
      assignmentPermissionCodes: (selectedPosition.assignment_permission_codes || []).join(", "),
      onboardingNotes: selectedPosition.onboarding_notes || "",
      volunteerPerks: selectedPosition.volunteer_perks || template?.volunteer_perks || [],
      payAmount: selectedPosition.pay_amount || template?.pay_amount || "",
      payType: selectedPosition.pay_type || template?.pay_type || "",
      employmentStatus: selectedPosition.employment_status || template?.employment_status || "",
      accessTrack: selectedPosition.access_track || template?.access_track || "none",
    });
  }, [selectedPosition]);

  useEffect(() => {
    if (!selectedAssignment) return;
    setAssignmentForm({
      id: selectedAssignment.id,
      positionId: selectedAssignment.position_id || "",
      userId: selectedAssignment.user_id || "",
      applicationId: selectedAssignment.application_id || "",
      assignmentStatus: selectedAssignment.assignment_status || "pending",
      notes: selectedAssignment.notes || "",
    });
  }, [selectedAssignment]);

  async function saveTemplate(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveTemplate",
        ...templateForm,
        responsibilities: parseLines(templateForm.responsibilities || ""),
        requirements: parseLines(templateForm.requirements || ""),
        defaultOperationalTags: String(templateForm.defaultOperationalTags || "")
          .split(",")
          .map((value: string) => value.trim())
          .filter(Boolean),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save role template.");
      return;
    }
    setMessage(templateForm.id ? "Role template updated." : "Role template created.");
    await load();
  }

  async function savePosition(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...positionForm,
        action: "savePosition",
        assignmentPermissionCodes: String(positionForm.assignmentPermissionCodes || "")
          .split(",")
          .map((value: string) => value.trim())
          .filter(Boolean),
      }),
    });
    const json = (await res.json()) as { error?: string; positionId?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save position.");
      return;
    }
    setMessage(positionForm.id ? "Open position updated." : "Open position created.");
    if (json.positionId) setSelectedPositionId(json.positionId);
    await load();
  }

  async function saveAssignment(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveAssignment", ...assignmentForm }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save assignment.");
      return;
    }
    setMessage(assignmentForm.id ? "Assignment updated." : "Assignment saved.");
    await load();
  }

  const stats = useMemo(
    () => ({
      templates: templates.length,
      openPositions: positions.filter((position) => position.position_status === "open").length,
      volunteer: templates.filter((template) => template.role_type === "volunteer").length,
      paid: templates.filter((template) => template.role_type === "paid").length,
      pendingAssignments: assignments.filter((assignment) => assignment.assignment_status === "pending").length,
      applicants: applicants.filter((applicant) => applicant.status === "submitted").length,
      playerApplications: playerApplications.length,
    }),
    [applicants, assignments, playerApplications.length, positions, templates],
  );

  const staffingCityOptions = useMemo(() => {
    return Array.from(
      new Set(
        [...INTERNAL_CITY_OPTIONS, ...positions.map((position) => position.city).filter(Boolean), ...applicants.map((applicant) => applicant.city).filter(Boolean)] as string[],
      ),
    );
  }, [applicants, positions]);

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">EPL staffing</div>
            <h1 className="ev-title">Run templates, openings, assignments, and public listings from one staffing desk.</h1>
            <p className="ev-subtitle">
              Templates define the role. Positions track live demand. Assignments connect real people to real openings without mixing public copy and internal staffing logic.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="ev-meta-card"><div className="ev-meta-label">Templates</div><div className="ev-meta-value">{stats.templates}</div></div>
            <div className="ev-meta-card"><div className="ev-meta-label">Open positions</div><div className="ev-meta-value">{stats.openPositions}</div></div>
            <div className="ev-meta-card"><div className="ev-meta-label">Applicants waiting</div><div className="ev-meta-value">{stats.applicants}</div></div>
            <div className="ev-meta-card"><div className="ev-meta-label">Player applications</div><div className="ev-meta-value">{stats.playerApplications}</div></div>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <section className="mt-6 flex flex-wrap gap-3">
        {[
          ["templates", "Templates"],
          ["open_positions", "Open Positions"],
          ["assignments", "Assignments"],
          ["applicants", "Applicants"],
          ["public_listings", "Public Listings"],
          ["player_applications", "Player Applications"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === key ? "bg-white text-black" : "border border-white/10 bg-black/30 text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="ev-panel p-5 xl:col-start-2">
          <div className="ev-section-kicker">{activeTab === "templates" ? "Role templates" : activeTab === "assignments" ? "Assignments" : activeTab === "applicants" ? "Applicants" : activeTab === "public_listings" ? "Public listings" : activeTab === "player_applications" ? "EPL player applications" : "Open positions"}</div>
          <div className="mt-4 grid gap-3">
            {activeTab === "templates" ? (
              <>
                <select className="ev-field" value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}>
                  <option value="all">All templates</option>
                  <option value="paid">Paid</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select className="ev-field" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                  <option value="all">All departments</option>
                  {Array.from(new Set(templates.map((template) => template.department).filter(Boolean))).map((department) => (
                    <option key={department} value={department || ""}>
                      {department}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {activeTab === "templates" ? filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateId(template.id);
                  if (!positionForm.roleTemplateId) {
                    setPositionForm((current: Record<string, any>) => ({
                      ...current,
                      roleTemplateId: template.id,
                      accessRoleId: template.default_access_role_id || "",
                      volunteerPerks: template.volunteer_perks || [],
                      payAmount: template.pay_amount || "",
                      payType: template.pay_type || "",
                      employmentStatus: template.employment_status || "",
                      accessTrack: template.access_track || "none",
                    }));
                  }
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedTemplateId === template.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{template.title}</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#caa7ff]">{template.role_type}</span>
                </div>
                <div className="mt-2 text-sm text-white/58">{template.department || "General operations"}</div>
              </button>
            )) : null}
            {activeTab === "player_applications" ? (
              playerApplications.length ? playerApplications.map((application) => (
                <button
                  key={application.key}
                  type="button"
                  onClick={() => setSelectedPlayerApplicationKey(application.key)}
                  className={`w-full rounded-2xl border p-4 text-left ${selectedPlayerApplicationKey === application.key ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"}`}
                >
                  <div className="text-sm font-semibold text-white">{application.applicantName}</div>
                  <div className="mt-1 text-sm text-white/58">{application.email}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{application.stage.replace(/_/g, " ")}</div>
                </button>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/48">
                  No EPL player applications are in queue right now.
                </div>
              )
            ) : null}
          </div>
        </section>

        <section className="ev-panel p-5">
          {activeTab === "templates" ? (
            <>
              <div className="ev-section-kicker">Role template editor</div>
              <h2 className="mt-3 text-2xl font-bold text-white">{templateForm.id ? "Edit role template" : "Create role template"}</h2>
              <form onSubmit={saveTemplate} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="ev-field" placeholder="Title" value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} />
                  <input className="ev-field" placeholder="Slug or code" value={templateForm.roleCode} onChange={(e) => setTemplateForm({ ...templateForm, roleCode: e.target.value })} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="ev-field" placeholder="Department" value={templateForm.department} onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })} />
                  <select className="ev-field" value={templateForm.roleType} onChange={(e) => setTemplateForm({ ...templateForm, roleType: e.target.value })}>
                    <option value="volunteer">Volunteer</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <input className="ev-field" placeholder="Short summary" value={templateForm.summary} onChange={(e) => setTemplateForm({ ...templateForm, summary: e.target.value })} />
                <textarea className="ev-textarea" rows={4} placeholder="Responsibilities, one per line" value={templateForm.responsibilities} onChange={(e) => setTemplateForm({ ...templateForm, responsibilities: e.target.value })} />
                <textarea className="ev-textarea" rows={4} placeholder="Requirements, one per line" value={templateForm.requirements} onChange={(e) => setTemplateForm({ ...templateForm, requirements: e.target.value })} />

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">{templateForm.roleType === "paid" ? "Paid role settings" : "Volunteer perks"}</div>
                  {templateForm.roleType === "paid" ? (
                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                      <input className="ev-field" type="number" placeholder="Pay amount" value={templateForm.payAmount} onChange={(e) => setTemplateForm({ ...templateForm, payAmount: e.target.value })} />
                      <select className="ev-field" value={templateForm.payType} onChange={(e) => setTemplateForm({ ...templateForm, payType: e.target.value })}>
                        <option value="">Pay type</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="stipend">Stipend</option>
                        <option value="fixed">Fixed</option>
                      </select>
                      <select className="ev-field" value={templateForm.employmentStatus} onChange={(e) => setTemplateForm({ ...templateForm, employmentStatus: e.target.value })}>
                        <option value="">Employment status</option>
                        <option value="full_time">Full time</option>
                        <option value="part_time">Part time</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="event_based">Event based</option>
                      </select>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {volunteerPerks.map((perk) => (
                        <label key={perk} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                          <input
                            type="checkbox"
                            checked={templateForm.volunteerPerks.includes(perk)}
                            onChange={(event) =>
                              setTemplateForm((current: Record<string, any>) => ({
                                ...current,
                                volunteerPerks: event.target.checked
                                  ? [...current.volunteerPerks, perk]
                                  : current.volunteerPerks.filter((item: string) => item !== perk),
                              }))
                            }
                          />
                          {perk}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <select className="ev-field" value={templateForm.defaultAccessRoleId} onChange={(e) => setTemplateForm({ ...templateForm, defaultAccessRoleId: e.target.value })}>
                    <option value="">No default access role</option>
                    {accessRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <select className="ev-field" value={templateForm.accessTrack} onChange={(e) => setTemplateForm({ ...templateForm, accessTrack: e.target.value })}>
                    <option value="none">No system access</option>
                    <option value="limited_ops">Limited operational access</option>
                    <option value="scanner">Scanner access</option>
                    <option value="support">Support access</option>
                    <option value="workforce">Workforce access</option>
                    <option value="office">Office-level access</option>
                  </select>
                </div>
                <input className="ev-field" placeholder="Default assignment permissions" value={templateForm.defaultAssignmentPermissionCodes} onChange={(e) => setTemplateForm({ ...templateForm, defaultAssignmentPermissionCodes: e.target.value })} />
                <input className="ev-field" placeholder="Default operational tags" value={templateForm.defaultOperationalTags} onChange={(e) => setTemplateForm({ ...templateForm, defaultOperationalTags: e.target.value })} />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="ev-button-primary">{templateForm.id ? "Save template" : "Create template"}</button>
                  <button type="button" className="ev-button-secondary" onClick={() => setTemplateForm({
                    title: "", roleCode: "", department: "Operations", roleType: "volunteer", summary: "", responsibilities: "", requirements: "", defaultAccessRoleId: "", defaultAssignmentPermissionCodes: "", defaultOperationalTags: "", volunteerPerks: [], payAmount: "", payType: "", employmentStatus: "", accessTrack: "none", isActive: true, sortOrder: 100,
                  })}>New template</button>
                </div>
              </form>
            </>
          ) : activeTab === "assignments" ? (
            <>
              <div className="ev-section-kicker">Assignments</div>
              <div className="mt-4 space-y-3">
                {assignments.map((assignment) => {
                  const position = assignment.staff_positions;
                  const template = unwrapOne(position?.staff_role_templates);
                  const assignee = unwrapOne(assignment.evntszn_profiles);
                  const applicant = unwrapOne(assignment.staff_applications);
                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      className={`w-full rounded-2xl border p-4 text-left ${selectedAssignmentId === assignment.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{position?.title_override || template?.title || "Assignment"}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#caa7ff]">{assignment.assignment_status}</span>
                      </div>
                      <div className="mt-2 text-sm text-white/58">{assignee?.full_name || `${applicant?.first_name || ""} ${applicant?.last_name || ""}`.trim() || applicant?.email || "Unassigned"}</div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : activeTab === "applicants" ? (
            <>
              <div className="ev-section-kicker">Applicants</div>
              <div className="mt-4 space-y-3">
                {applicants.map((applicant) => (
                  <button
                    key={applicant.id}
                    type="button"
                    onClick={() => setSelectedApplicantId(applicant.id)}
                    className={`w-full rounded-2xl border p-4 text-left ${selectedApplicantId === applicant.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"}`}
                  >
                    <div className="text-sm font-semibold text-white">{applicant.first_name} {applicant.last_name}</div>
                    <div className="mt-1 text-sm text-white/58">{applicant.email}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{applicant.status}</div>
                  </button>
                ))}
              </div>
            </>
          ) : activeTab === "player_applications" ? (
            <>
              <div className="ev-section-kicker">Player application routing</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Player intake is reviewed in the Application Command Center.</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                Use this desk for staffing templates, openings, assignments, and public listings. Use the dedicated EPL player queue in Approvals for registration review and decisions.
              </div>
              {selectedPlayerApplication ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Selected player application</div>
                  <div className="mt-3 text-2xl font-bold text-white">{selectedPlayerApplication.applicantName}</div>
                  <div className="mt-2 text-sm text-white/58">{selectedPlayerApplication.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                    <span>{selectedPlayerApplication.stage.replace(/_/g, " ")}</span>
                    {selectedPlayerApplication.city ? <span>{selectedPlayerApplication.city}</span> : null}
                    {selectedPlayerApplication.status ? <span>{selectedPlayerApplication.status}</span> : null}
                  </div>
                  <div className="mt-4 text-sm text-white/62">{selectedPlayerApplication.notes || "No internal notes yet."}</div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/epl/admin/approvals" className="ev-button-primary">Open EPL player queue</Link>
                <button type="button" className="ev-button-secondary" onClick={() => setActiveTab("open_positions")}>Back to staffing</button>
              </div>
            </>
          ) : (
            <>
              <div className="ev-section-kicker">{activeTab === "public_listings" ? "Public listings" : "Open positions"}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select className="ev-field" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="nearly_filled">Nearly filled</option>
                  <option value="filled">Filled</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
                <button type="button" className="ev-button-secondary" onClick={() => setSelectedPositionId(null)}>
                  New position
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {visiblePositions.map((position) => {
                  const template = unwrapOne(position.staff_role_templates);
                  const event = unwrapOne(position.evntszn_events);
                  const season = unwrapOne(position.seasons);
                  return (
                    <button
                      key={position.id}
                      type="button"
                      onClick={() => setSelectedPositionId(position.id)}
                      className={`w-full rounded-2xl border p-4 text-left ${selectedPositionId === position.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{position.title_override || template?.title || "Open position"}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#caa7ff]">{template?.role_type || "volunteer"}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">{position.position_status}</span>
                      </div>
                      <div className="mt-2 text-sm text-white/58">
                        {[event?.title || season?.name || null, position.city || null].filter(Boolean).join(" • ")}
                      </div>
                      <div className="mt-2 text-xs text-white/50">
                        {position.slots_filled}/{position.slots_needed} filled • {position.visibility === "public" ? "Public" : "Internal only"} • Priority {position.priority}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="ev-panel p-6 xl:col-start-2">
          {activeTab === "templates" ? (
            <>
              <div className="ev-section-kicker">Template summary</div>
              {selectedTemplate ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-white">{selectedTemplate.title}</div>
                    <div className="mt-2 text-sm text-white/58">{selectedTemplate.summary || "No summary yet."}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Template details</div>
                      <div className="mt-3 grid gap-3 text-sm text-white/68">
                        <div>Department: {selectedTemplate.department || "General"}</div>
                        <div>Type: {selectedTemplate.role_type}</div>
                        <div>Default access: {unwrapOne(selectedTemplate.roles)?.name || "None"}</div>
                        <div>Access track: {selectedTemplate.access_track?.replace(/_/g, " ") || "none"}</div>
                        <div>Requirements: {(selectedTemplate.requirements || []).length}</div>
                      </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">Choose a template or create a new one.</div>
              )}
            </>
          ) : activeTab === "assignments" ? (
            <>
              <div className="ev-section-kicker">Assignment detail</div>
              <h2 className="mt-3 text-2xl font-bold text-white">{assignmentForm.id ? "Update assignment" : "Create assignment"}</h2>
              <form onSubmit={saveAssignment} className="mt-5 grid gap-4">
                <select className="ev-field" value={assignmentForm.positionId} onChange={(e) => setAssignmentForm({ ...assignmentForm, positionId: e.target.value })}>
                  <option value="">Choose position</option>
                  {positions.map((position) => {
                    const template = unwrapOne(position.staff_role_templates);
                    return <option key={position.id} value={position.id}>{position.title_override || template?.title || "Position"}</option>;
                  })}
                </select>
                <select className="ev-field" value={assignmentForm.applicationId} onChange={(e) => setAssignmentForm({ ...assignmentForm, applicationId: e.target.value })}>
                  <option value="">Link applicant later</option>
                  {applicants.map((applicant) => (
                    <option key={applicant.id} value={applicant.id}>{applicant.first_name} {applicant.last_name} • {applicant.email}</option>
                  ))}
                </select>
                <select className="ev-field" value={assignmentForm.userId} onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}>
                  <option value="">No internal user linked yet</option>
                  {users.map((staffUser) => (
                    <option key={staffUser.user_id} value={staffUser.user_id}>{staffUser.full_name || staffUser.user_id}</option>
                  ))}
                </select>
                <select className="ev-field" value={assignmentForm.assignmentStatus} onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentStatus: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                  <option value="removed">Removed</option>
                </select>
                <textarea className="ev-textarea" rows={4} placeholder="Assignment notes" value={assignmentForm.notes} onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })} />
                <button type="submit" className="ev-button-primary">{assignmentForm.id ? "Save assignment" : "Assign staff"}</button>
              </form>
            </>
          ) : activeTab === "applicants" ? (
            <>
              <div className="ev-section-kicker">Applicant detail</div>
              {selectedApplicant ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-2xl font-bold text-white">{selectedApplicant.first_name} {selectedApplicant.last_name}</div>
                    <div className="mt-2 text-sm text-white/58">{selectedApplicant.email}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{selectedApplicant.status}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Preferred roles</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedApplicant.preferred_roles || []).length ? (
                        (selectedApplicant.preferred_roles || []).map((role) => (
                          <span key={role} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{role}</span>
                        ))
                      ) : (
                        <span className="text-sm text-white/48">No preferred roles provided.</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ev-button-primary"
                    onClick={() => {
                      setActiveTab("assignments");
                      setAssignmentForm({
                        id: "",
                        positionId: selectedApplicant.position_id || "",
                        userId: "",
                        applicationId: selectedApplicant.id,
                        assignmentStatus: "assigned",
                        notes: "",
                      });
                    }}
                  >
                    Create assignment
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">Select an applicant to review and assign.</div>
              )}
            </>
          ) : (
            <>
              <div className="ev-section-kicker">Position detail</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["overview", "Overview"],
                  ["public_listing", "Public Listing"],
                  ["assignments", "Assignments"],
                  ["access", "Access"],
                  ["notes", "Notes"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDetailTab(key as typeof detailTab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      detailTab === key ? "bg-white text-black" : "border border-white/10 bg-black/30 text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form onSubmit={savePosition} className="mt-5 grid gap-4">
                {detailTab === "overview" ? (
                  <>
                    <select className="ev-field" value={positionForm.roleTemplateId} onChange={(e) => setPositionForm({ ...positionForm, roleTemplateId: e.target.value })}>
                      <option value="">Select role template</option>
                      {templates.filter((template) => template.is_active).map((template) => (
                        <option key={template.id} value={template.id}>{template.title}</option>
                      ))}
                    </select>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="ev-field" placeholder="Title override" value={positionForm.titleOverride} onChange={(e) => setPositionForm({ ...positionForm, titleOverride: e.target.value })} />
                      <select className="ev-field" value={positionForm.positionStatus} onChange={(e) => setPositionForm({ ...positionForm, positionStatus: e.target.value })}>
                        <option value="open">Open</option>
                        <option value="nearly_filled">Nearly filled</option>
                        <option value="filled">Filled</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <select className="ev-field" value={positionForm.seasonId} onChange={(e) => setPositionForm({ ...positionForm, seasonId: e.target.value })}>
                        <option value="">No season linkage</option>
                        {seasons.map((season) => (
                          <option key={season.id} value={season.slug}>{season.name}</option>
                        ))}
                      </select>
                      <select className="ev-field" value={positionForm.eventId} onChange={(e) => setPositionForm({ ...positionForm, eventId: e.target.value })}>
                        <option value="">No event linkage</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>{event.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <select
                        className="ev-field"
                        value={positionForm.city}
                        onChange={(e) =>
                          setPositionForm({
                            ...positionForm,
                            city: e.target.value,
                            state: getCityStateCode(e.target.value) || positionForm.state,
                          })
                        }
                      >
                        <option value="">City</option>
                        {staffingCityOptions.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <input className="ev-field" placeholder="State" value={positionForm.state} onChange={(e) => setPositionForm({ ...positionForm, state: e.target.value })} />
                      <input className="ev-field" type="number" placeholder="Slots needed" value={positionForm.slotsNeeded} onChange={(e) => setPositionForm({ ...positionForm, slotsNeeded: Number(e.target.value || 1) })} />
                      <input className="ev-field" type="number" placeholder="Slots filled" value={positionForm.slotsFilled} onChange={(e) => setPositionForm({ ...positionForm, slotsFilled: Number(e.target.value || 0) })} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/58">
                      Internal staffing logic lives in templates, access track, permissions, and assignments. Public listing copy only appears when this position is public and listed.
                    </div>
                  </>
                ) : null}

                {detailTab === "public_listing" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <select className="ev-field" value={positionForm.visibility} onChange={(e) => setPositionForm({ ...positionForm, visibility: e.target.value })}>
                        <option value="public">Public</option>
                        <option value="internal_only">Internal only</option>
                      </select>
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                        <input type="checkbox" checked={Boolean(positionForm.publiclyListed)} onChange={(e) => setPositionForm({ ...positionForm, publiclyListed: e.target.checked })} />
                        Show in public listings
                      </label>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Listing type</div>
                      {selectedTemplate?.role_type === "paid" || templates.find((template) => template.id === positionForm.roleTemplateId)?.role_type === "paid" ? (
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                          <input className="ev-field" type="number" placeholder="Pay amount" value={positionForm.payAmount} onChange={(e) => setPositionForm({ ...positionForm, payAmount: e.target.value })} />
                          <select className="ev-field" value={positionForm.payType} onChange={(e) => setPositionForm({ ...positionForm, payType: e.target.value })}>
                            <option value="">Pay type</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="stipend">Stipend</option>
                            <option value="fixed">Fixed</option>
                          </select>
                          <select className="ev-field" value={positionForm.employmentStatus} onChange={(e) => setPositionForm({ ...positionForm, employmentStatus: e.target.value })}>
                            <option value="">Employment status</option>
                            <option value="full_time">Full time</option>
                            <option value="part_time">Part time</option>
                            <option value="seasonal">Seasonal</option>
                            <option value="event_based">Event based</option>
                          </select>
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {volunteerPerks.map((perk) => (
                            <label key={perk} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                              <input
                                type="checkbox"
                                checked={positionForm.volunteerPerks.includes(perk)}
                                onChange={(event) =>
                                  setPositionForm((current: Record<string, any>) => ({
                                    ...current,
                                    volunteerPerks: event.target.checked
                                      ? [...current.volunteerPerks, perk]
                                      : current.volunteerPerks.filter((item: string) => item !== perk),
                                  }))
                                }
                              />
                              {perk}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                {detailTab === "assignments" ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/58">
                      {assignments.filter((assignment) => assignment.position_id === (positionForm.id || selectedPositionId)).length} assignment record(s) linked to this position.
                    </div>
                    <button type="button" className="ev-button-secondary" onClick={() => {
                      setActiveTab("assignments");
                      setAssignmentForm({ id: "", positionId: positionForm.id || selectedPositionId || "", userId: "", applicationId: "", assignmentStatus: "assigned", notes: "" });
                    }}>
                      Assign staff
                    </button>
                  </>
                ) : null}

                {detailTab === "access" ? (
                  <>
                    <select className="ev-field" value={positionForm.accessRoleId} onChange={(e) => setPositionForm({ ...positionForm, accessRoleId: e.target.value })}>
                      <option value="">No linked access role</option>
                      {accessRoles.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <select className="ev-field" value={positionForm.accessTrack} onChange={(e) => setPositionForm({ ...positionForm, accessTrack: e.target.value })}>
                      <option value="none">No system access</option>
                      <option value="limited_ops">Limited operational access</option>
                      <option value="scanner">Scanner access</option>
                      <option value="support">Support access</option>
                      <option value="workforce">Workforce access</option>
                      <option value="office">Office-level access</option>
                    </select>
                    <input className="ev-field" placeholder="Assignment permission requirements" value={positionForm.assignmentPermissionCodes} onChange={(e) => setPositionForm({ ...positionForm, assignmentPermissionCodes: e.target.value })} />
                    <textarea className="ev-textarea" rows={4} placeholder="Onboarding notes for access setup" value={positionForm.onboardingNotes} onChange={(e) => setPositionForm({ ...positionForm, onboardingNotes: e.target.value })} />
                  </>
                ) : null}

                {detailTab === "notes" ? (
                  <>
                    <textarea className="ev-textarea" rows={6} placeholder="Internal notes for staffing, outreach, or event-day context" value={positionForm.notes} onChange={(e) => setPositionForm({ ...positionForm, notes: e.target.value })} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="ev-field" type="datetime-local" value={positionForm.startsAt} onChange={(e) => setPositionForm({ ...positionForm, startsAt: e.target.value })} />
                      <input className="ev-field" type="datetime-local" value={positionForm.endsAt} onChange={(e) => setPositionForm({ ...positionForm, endsAt: e.target.value })} />
                    </div>
                  </>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="ev-button-primary">{positionForm.id ? "Save position" : "Open position"}</button>
                  <button type="button" className="ev-button-secondary" onClick={() => setPositionForm({
                    roleTemplateId: selectedTemplateId || "",
                    titleOverride: "",
                    seasonId: "",
                    eventId: "",
                    city: "Baltimore",
                    state: "MD",
                    positionStatus: "open",
                    visibility: "public",
                    slotsNeeded: 2,
                    slotsFilled: 0,
                    priority: 100,
                    notes: "",
                    publiclyListed: true,
                    startsAt: "",
                    endsAt: "",
                    accessRoleId: "",
                    assignmentPermissionCodes: "",
                    onboardingNotes: "",
                    volunteerPerks: [],
                    payAmount: "",
                    payType: "",
                    employmentStatus: "",
                    accessTrack: "none",
                  })}>New position</button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
