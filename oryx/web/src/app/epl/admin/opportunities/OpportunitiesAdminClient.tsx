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

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
  const [search, setSearch] = useState("");
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
    city: "",
    state: "",
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
      const normalizedSearch = search.trim().toLowerCase();
      if (normalizedSearch) {
        const template = unwrapOne(position.staff_role_templates);
        const event = unwrapOne(position.evntszn_events);
        const season = unwrapOne(position.seasons);
        const haystack = [
          position.title_override,
          template?.title,
          template?.department,
          position.city,
          position.state,
          event?.title,
          season?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
    return base;
  }, [activeTab, positionFilter, positions, search]);

  const visiblePlayerApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return playerApplications;
    return playerApplications.filter((application) =>
      [application.applicantName, application.email, application.city, application.stage, application.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [playerApplications, search]);

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
    if (!selectedPosition) {
      setPositionForm({
        roleTemplateId: "",
        titleOverride: "",
        seasonId: "",
        eventId: "",
        city: "",
        state: "",
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
      return;
    }
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
      startsAt: toDateTimeLocalValue(selectedPosition.starts_at),
      endsAt: toDateTimeLocalValue(selectedPosition.ends_at),
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
        startsAt: toIsoDateTime(positionForm.startsAt),
        endsAt: toIsoDateTime(positionForm.endsAt),
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

  const selectedPositionTemplate = templates.find((template) => template.id === positionForm.roleTemplateId) || selectedTemplate;
  const selectedPositionWillRenderPublicly =
    positionForm.visibility === "public" &&
    Boolean(positionForm.publiclyListed) &&
    !["closed", "archived"].includes(String(positionForm.positionStatus || ""));
  const activeTabMeta: Record<typeof activeTab, { title: string; description: string }> = {
    templates: {
      title: "Role templates",
      description: "Reusable role definitions. Set the baseline summary, compensation, access track, and operator expectations once, then reuse them when you open positions.",
    },
    open_positions: {
      title: "Open positions",
      description: "Live staffing needs. Open positions connect the template, the market, the listing status, and the assignment path in one record.",
    },
    assignments: {
      title: "Assignments",
      description: "Who is attached to what. Use this queue to confirm the assignee, the linked application, and the current assignment status without jumping between tools.",
    },
    applicants: {
      title: "Applicants",
      description: "People who applied into staffing roles. Review the applicant, confirm fit, then move them directly into an assignment when a slot is ready.",
    },
    public_listings: {
      title: "Public listings",
      description: "What applicants can actually see on the public EPL opportunities page. A role appears publicly only when it is public, listed, and not closed or archived.",
    },
    player_applications: {
      title: "Player intake",
      description: "Player registrations live in the approvals and draft workflow. This tab exists so staffing operators can see where player intake belongs without guessing.",
    },
  };

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Operational staffing</div>
            <h1 className="ev-title">Opportunities, templates, and workforce assignments.</h1>
            <p className="ev-subtitle">
              Manage role templates, open new positions for public or internal intake, and track staff assignments from one unified desk.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Open Positions", stats.openPositions],
              ["Total Templates", stats.templates],
              ["Active Assignments", assignments.filter((a) => a.assignment_status === "assigned" || a.assignment_status === "confirmed").length],
              ["New Applicants", applicants.filter((a) => a.status === "submitted").length],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-meta-card">
                <div className="ev-meta-label">{label}</div>
                <div className="ev-meta-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {[
          ["open_positions", "Open positions"],
          ["public_listings", "Public listings"],
          ["templates", "Role templates"],
          ["assignments", "Assignments"],
          ["applicants", "Applicants"],
          ["player_applications", "Player intake"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition ${
              activeTab === key ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 ev-panel p-6">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <div className="ev-section-kicker">{activeTabMeta[activeTab].title}</div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/62">{activeTabMeta[activeTab].description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(activeTab === "open_positions" || activeTab === "public_listings" || activeTab === "player_applications") ? (
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>Search queue</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={activeTab === "player_applications" ? "Search player intake by name, email, city, or stage" : "Search title, market, event, season, or role"}
                  className="ev-field"
                />
              </label>
            ) : null}
            {(activeTab === "open_positions" || activeTab === "public_listings") ? (
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>Status filter</span>
                <select className="ev-field" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="filled">Filled</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[460px_1fr] xl:grid-cols-[520px_1fr]">
        <section className="ev-panel max-h-[1200px] overflow-y-auto p-6 lg:p-7">
          {activeTab === "templates" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="ev-section-kicker">Templates</div>
                  <div className="mt-2 text-sm text-white/55">Reusable role definitions for paid and volunteer staffing.</div>
                </div>
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]" onClick={() => setTemplateForm({
                  title: "", roleCode: "", department: "Operations", roleType: "volunteer", summary: "", responsibilities: "", requirements: "", defaultAccessRoleId: "", defaultAssignmentPermissionCodes: "", defaultOperationalTags: "", volunteerPerks: [], payAmount: "", payType: "", employmentStatus: "", accessTrack: "none", isActive: true, sortOrder: 100,
                })}>New Template</button>
              </div>
              <div className="mt-4 space-y-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedTemplateId === template.id ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]" : "border-white/10 bg-black/30 hover:border-white/20"}`}
                  >
                    <div className="text-sm font-semibold text-white">{template.title}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{template.department || "General"} · {template.role_type}</div>
                  </button>
                ))}
              </div>
            </>
          ) : activeTab === "assignments" ? (
            <>
              <div>
                <div className="ev-section-kicker">Assignments</div>
                <div className="mt-2 text-sm text-white/55">Confirmed and pending staffing links between a role, an applicant, and an internal assignee.</div>
              </div>
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
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedAssignmentId === assignment.id ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]" : "border-white/10 bg-black/30 hover:border-white/20"}`}
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
              <div>
                <div className="ev-section-kicker">Applicants</div>
                <div className="mt-2 text-sm text-white/55">Review staffing applicants, confirm fit, and move them into assignments without leaving the desk.</div>
              </div>
              <div className="mt-4 space-y-3">
                {applicants.map((applicant) => (
                  <button
                    key={applicant.id}
                    type="button"
                    onClick={() => setSelectedApplicantId(applicant.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedApplicantId === applicant.id ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]" : "border-white/10 bg-black/30 hover:border-white/20"}`}
                  >
                    <div className="text-sm font-semibold text-white">{applicant.first_name} {applicant.last_name}</div>
                    <div className="mt-1 text-sm text-white/58">{applicant.email}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-[#caa7ff]">{applicant.status}</div>
                  </button>
                ))}
              </div>
            </>
          ) : activeTab === "player_applications" ? (
            <>
              <div className="ev-section-kicker">Intake Guide</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="text-sm leading-relaxed text-white/60">
                  Player intake is reviewed in the <span className="text-white">Application Command Center</span>. Use this desk for workforce and operational staffing only.
                </p>
                <div className="mt-6 grid gap-3">
                  <Link href="/epl/admin/approvals" className="ev-button-primary w-full text-center">Open approvals</Link>
                  <Link href="/epl/admin/draft" className="ev-button-secondary w-full text-center">Open draft console</Link>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {visiblePlayerApplications.map((application) => (
                  <button
                    key={application.key}
                    type="button"
                    onClick={() => setSelectedPlayerApplicationKey(application.key)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedPlayerApplicationKey === application.key ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]" : "border-white/10 bg-black/30 hover:border-white/20"}`}
                  >
                    <div className="text-sm font-semibold text-white">{application.applicantName}</div>
                    <div className="mt-1 text-xs text-white/50">{application.email}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[#caa7ff]">{application.stage.replace(/_/g, " ")}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="ev-section-kicker">{activeTab === "public_listings" ? "Public listings" : "Open positions"}</div>
                  <div className="mt-2 text-sm text-white/55">
                    {activeTab === "public_listings"
                      ? "Roles that will appear publicly when the listing rules are satisfied."
                      : "Live staffing needs tied to the current league and event workflow."}
                  </div>
                </div>
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]" onClick={() => setSelectedPositionId(null)}>New Position</button>
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
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedPositionId === position.id ? "border-[#A259FF]/40 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]" : "border-white/10 bg-black/30 hover:border-white/20"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{position.title_override || template?.title || "Open position"}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#caa7ff]">{template?.role_type || "volunteer"}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-white/58">
                        {[event?.title || season?.name || null, position.city || null].filter(Boolean).join(" • ")}
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                        {position.slots_filled}/{position.slots_needed} filled · {position.position_status}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="ev-panel p-6 lg:p-8">
          {activeTab === "templates" ? (
            <div className="grid gap-10 xl:grid-cols-2">
              <div>
                <div className="ev-section-kicker">Template configuration</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{templateForm.id ? "Edit role" : "New role"}</h2>
                <form onSubmit={saveTemplate} className="mt-8 grid gap-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Title</span>
                      <input className="ev-field" placeholder="Lead Security" value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} required />
                    </label>
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Code</span>
                      <input className="ev-field" placeholder="SEC-LEAD" value={templateForm.roleCode} onChange={(e) => setTemplateForm({ ...templateForm, roleCode: e.target.value })} />
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Department</span>
                      <input className="ev-field" placeholder="Operations" value={templateForm.department} onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })} />
                    </label>
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Type</span>
                      <select className="ev-field" value={templateForm.roleType} onChange={(e) => setTemplateForm({ ...templateForm, roleType: e.target.value as "paid" | "volunteer" })}>
                        <option value="volunteer">Volunteer</option>
                        <option value="paid">Paid</option>
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Summary</span>
                    <input className="ev-field" placeholder="Primary point of contact for..." value={templateForm.summary} onChange={(e) => setTemplateForm({ ...templateForm, summary: e.target.value })} />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Responsibilities (one per line)</span>
                    <textarea className="ev-textarea" rows={4} placeholder="Check badges&#10;Escort guests..." value={templateForm.responsibilities} onChange={(e) => setTemplateForm({ ...templateForm, responsibilities: e.target.value })} />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Requirements (one per line)</span>
                    <textarea className="ev-textarea" rows={4} placeholder="Age 21+&#10;Own transport..." value={templateForm.requirements} onChange={(e) => setTemplateForm({ ...templateForm, requirements: e.target.value })} />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" className="ev-button-primary">{templateForm.id ? "Save template" : "Create template"}</button>
                    {templateForm.id && (
                      <button type="button" className="ev-button-secondary" onClick={() => setTemplateForm({
                        title: "", roleCode: "", department: "Operations", roleType: "volunteer", summary: "", responsibilities: "", requirements: "", defaultAccessRoleId: "", defaultAssignmentPermissionCodes: "", defaultOperationalTags: "", volunteerPerks: [], payAmount: "", payType: "", employmentStatus: "", accessTrack: "none", isActive: true, sortOrder: 100,
                      })}>Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-8">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#caa7ff]">Compensation & Access</div>
                  <div className="mt-6 grid gap-6">
                    {templateForm.roleType === "paid" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Pay Amount</span>
                          <input className="ev-field" type="number" value={templateForm.payAmount} onChange={(e) => setTemplateForm({ ...templateForm, payAmount: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Pay Type</span>
                          <select className="ev-field" value={templateForm.payType} onChange={(e) => setTemplateForm({ ...templateForm, payType: e.target.value })}>
                            <option value="">Choose...</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="stipend">Stipend</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </label>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {volunteerPerks.map((perk) => (
                          <label key={perk} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-white/70">
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

                    <div className="grid gap-4 md:grid-cols-2 border-t border-white/5 pt-6">
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Access Role</span>
                        <select className="ev-field" value={templateForm.defaultAccessRoleId} onChange={(e) => setTemplateForm({ ...templateForm, defaultAccessRoleId: e.target.value })}>
                          <option value="">None</option>
                          {accessRoles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Access Track</span>
                        <select className="ev-field" value={templateForm.accessTrack} onChange={(e) => setTemplateForm({ ...templateForm, accessTrack: e.target.value })}>
                          <option value="none">No access</option>
                          <option value="limited_ops">Limited Ops</option>
                          <option value="scanner">Scanner</option>
                          <option value="support">Support</option>
                          <option value="workforce">Workforce</option>
                          <option value="office">Office</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "assignments" ? (
            <div className="grid gap-10 xl:grid-cols-2">
              <div>
                <div className="ev-section-kicker">Assignment Detail</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{assignmentForm.id ? "Update record" : "New assignment"}</h2>
                <form onSubmit={saveAssignment} className="mt-8 grid gap-5">
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Position</span>
                    <select className="ev-field" value={assignmentForm.positionId} onChange={(e) => setAssignmentForm({ ...assignmentForm, positionId: e.target.value })} required>
                      <option value="">Choose position...</option>
                      {positions.map((position) => {
                        const template = unwrapOne(position.staff_role_templates);
                        return <option key={position.id} value={position.id}>{position.title_override || template?.title || "Position"}</option>;
                      })}
                    </select>
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Applicant (Optional link)</span>
                    <select className="ev-field" value={assignmentForm.applicationId} onChange={(e) => setAssignmentForm({ ...assignmentForm, applicationId: e.target.value })}>
                      <option value="">No link</option>
                      {applicants.map((applicant) => (
                        <option key={applicant.id} value={applicant.id}>{applicant.first_name} {applicant.last_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Internal User</span>
                    <select className="ev-field" value={assignmentForm.userId} onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}>
                      <option value="">Choose user...</option>
                      {users.map((staffUser) => (
                        <option key={staffUser.user_id} value={staffUser.user_id}>{staffUser.full_name || staffUser.user_id}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Status</span>
                    <select className="ev-field" value={assignmentForm.assignmentStatus} onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentStatus: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Notes</span>
                    <textarea className="ev-textarea" rows={4} value={assignmentForm.notes} onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })} />
                  </label>
                  <button type="submit" className="ev-button-primary">{assignmentForm.id ? "Save changes" : "Assign staff"}</button>
                </form>
              </div>
            </div>
          ) : activeTab === "applicants" ? (
            <div className="grid gap-10 xl:grid-cols-2">
              <div>
                <div className="ev-section-kicker">Review applicant</div>
                {selectedApplicant ? (
                  <div className="mt-3">
                    <h2 className="text-3xl font-black tracking-tight text-white">{selectedApplicant.first_name} {selectedApplicant.last_name}</h2>
                    <div className="mt-2 flex items-center gap-3 text-sm text-white/60">
                      <span>{selectedApplicant.email}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[#caa7ff] uppercase tracking-widest font-bold text-[10px]">{selectedApplicant.status}</span>
                    </div>
                    
                    <div className="mt-10 grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Preferred Roles</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(selectedApplicant.preferred_roles || []).map((role) => (
                            <span key={role} className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white/80">{role}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ev-button-primary w-full"
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
                        Create Assignment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
                    Select an applicant from the list to review.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "player_applications" ? (
            <div className="grid gap-10 xl:grid-cols-2">
              <div>
                <div className="ev-section-kicker">Review player application</div>
                {selectedPlayerApplication ? (
                  <div className="mt-3">
                    <h2 className="text-3xl font-black tracking-tight text-white">{selectedPlayerApplication.applicantName}</h2>
                    <div className="mt-2 flex items-center gap-3 text-sm text-white/60">
                      <span>{selectedPlayerApplication.email}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-[#caa7ff] uppercase tracking-widest font-bold text-[10px]">{selectedPlayerApplication.stage.replace(/_/g, " ")}</span>
                    </div>
                    
                    <div className="mt-10 grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Application Notes</div>
                        <div className="mt-4 text-sm text-white/70 leading-relaxed">
                          {selectedPlayerApplication.notes || "No internal notes provided."}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link href="/epl/admin/approvals" className="ev-button-primary flex-1 text-center">Open approvals</Link>
                        <Link href="/epl/admin/draft" className="ev-button-secondary flex-1 text-center">Draft console</Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
                    Select a player application from the list to review.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-10 xl:grid-cols-[1fr_400px]">
              <div>
                <div className="ev-section-kicker">Position Detail</div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                  Use the position detail to control the staffing record itself: role, market, listing visibility, access track, and internal notes. Templates stay reusable. Assignments stay separate.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["overview", "Overview"],
                    ["public_listing", "Public Listing"],
                    ["access", "Access"],
                    ["notes", "Notes"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDetailTab(key as typeof detailTab)}
                      className={`rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-widest transition ${
                        detailTab === key ? "bg-[#caa7ff] text-black" : "border border-white/10 bg-black/30 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={savePosition} className="mt-8 grid gap-6">
                  {detailTab === "overview" && (
                    <div className="grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/60">
                        Set the role shell first: template, live status, market, capacity, and the basic schedule window for the position.
                      </div>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Role Template</span>
                        <select className="ev-field" value={positionForm.roleTemplateId} onChange={(e) => setPositionForm({ ...positionForm, roleTemplateId: e.target.value })} required>
                          <option value="">Select template...</option>
                          {templates.filter((t) => t.is_active).map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Title Override</span>
                          <input className="ev-field" value={positionForm.titleOverride} onChange={(e) => setPositionForm({ ...positionForm, titleOverride: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Status</span>
                          <select className="ev-field" value={positionForm.positionStatus} onChange={(e) => setPositionForm({ ...positionForm, positionStatus: e.target.value })}>
                            <option value="open">Open</option>
                            <option value="filled">Filled</option>
                            <option value="closed">Closed</option>
                          </select>
                        </label>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>City</span>
                          <select className="ev-field" value={positionForm.city} onChange={(e) => setPositionForm({ ...positionForm, city: e.target.value, state: getCityStateCode(e.target.value) || positionForm.state })}>
                            <option value="">All markets</option>
                            {staffingCityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span>Needed</span>
                            <input className="ev-field" type="number" value={positionForm.slotsNeeded} onChange={(e) => setPositionForm({ ...positionForm, slotsNeeded: Number(e.target.value) })} />
                          </label>
                          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span>Filled</span>
                            <input className="ev-field" type="number" value={positionForm.slotsFilled} onChange={(e) => setPositionForm({ ...positionForm, slotsFilled: Number(e.target.value) })} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === "public_listing" && (
                    <div className="grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/60">
                        Public roles only appear on the EPL opportunities page when the position is public, listed, and still open. Use this section to control what applicants actually see.
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Visibility</span>
                          <select className="ev-field" value={positionForm.visibility} onChange={(e) => setPositionForm({ ...positionForm, visibility: e.target.value as "public" | "internal_only" })}>
                            <option value="public">Public</option>
                            <option value="internal_only">Internal only</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75 mt-6">
                          <input type="checkbox" checked={positionForm.publiclyListed} onChange={(e) => setPositionForm({ ...positionForm, publiclyListed: e.target.checked })} />
                          Show in public listings
                        </label>
                      </div>
                      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Compensation Profile</div>
                        {selectedPositionTemplate?.role_type === "paid" ? (
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <input className="ev-field" placeholder="Pay amount" value={positionForm.payAmount} onChange={(e) => setPositionForm({ ...positionForm, payAmount: e.target.value })} />
                            <select className="ev-field" value={positionForm.payType} onChange={(e) => setPositionForm({ ...positionForm, payType: e.target.value })}>
                              <option value="hourly">Hourly</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {volunteerPerks.map((p) => (
                              <label key={p} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-xs text-white/70">
                                <input type="checkbox" checked={positionForm.volunteerPerks.includes(p)} onChange={(e) => setPositionForm({ ...positionForm, volunteerPerks: e.target.checked ? [...positionForm.volunteerPerks, p] : positionForm.volunteerPerks.filter((item: string) => item !== p) })} />
                                {p}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === "access" && (
                    <div className="grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/60">
                        Access settings define what this staffing record can grant internally after assignment. Keep public listing details separate from internal access setup.
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Access Role</span>
                          <select className="ev-field" value={positionForm.accessRoleId} onChange={(e) => setPositionForm({ ...positionForm, accessRoleId: e.target.value })}>
                            <option value="">None</option>
                            {accessRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Track</span>
                          <select className="ev-field" value={positionForm.accessTrack} onChange={(e) => setPositionForm({ ...positionForm, accessTrack: e.target.value })}>
                            <option value="none">None</option>
                            <option value="limited_ops">Limited Ops</option>
                            <option value="scanner">Scanner</option>
                          </select>
                        </label>
                      </div>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Onboarding Notes</span>
                        <textarea className="ev-textarea" rows={4} value={positionForm.onboardingNotes} onChange={(e) => setPositionForm({ ...positionForm, onboardingNotes: e.target.value })} />
                      </label>
                    </div>
                  )}

                  {detailTab === "notes" && (
                    <div className="grid gap-6">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/60">
                        Internal notes stay on the staffing record. Start and end windows should use full date and time values that match the actual staffing window.
                      </div>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span>Internal Notes</span>
                        <textarea className="ev-textarea" rows={6} value={positionForm.notes} onChange={(e) => setPositionForm({ ...positionForm, notes: e.target.value })} />
                      </label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Starts</span>
                          <input className="ev-field" type="datetime-local" value={positionForm.startsAt} onChange={(e) => setPositionForm({ ...positionForm, startsAt: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Ends</span>
                          <input className="ev-field" type="datetime-local" value={positionForm.endsAt} onChange={(e) => setPositionForm({ ...positionForm, endsAt: e.target.value })} />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6 border-t border-white/5">
                    <button type="submit" className="ev-button-primary">{positionForm.id ? "Save Position" : "Open Position"}</button>
                    {positionForm.id && (
                      <button type="button" className="ev-button-secondary" onClick={() => setSelectedPositionId(null)}>Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-[#caa7ff]/5 p-6 shadow-xl">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]">Position Context</div>
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                      <span className="text-white/40">Filled</span>
                      <span className="text-white font-bold">{positionForm.slotsFilled} / {positionForm.slotsNeeded}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                      <span className="text-white/40">Publicly Listed</span>
                      <span className={selectedPositionWillRenderPublicly ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{selectedPositionWillRenderPublicly ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
