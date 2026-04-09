"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  id: string;
  role_code?: string | null;
  title: string;
  department: string | null;
  opportunity_type: string;
  summary: string | null;
  description: string | null;
  requirements: string[] | null;
  perks: string[] | null;
  pay_label: string | null;
  status: string;
  is_public?: boolean;
  location_city?: string | null;
  location_state?: string | null;
  priority_score?: number;
  display_order?: number;
  access_role_id?: string | null;
  assignment_permission_codes?: string[] | null;
  assignment_logic?: { notes?: string | null } | null;
};

type AccessRole = {
  id: string;
  name: string;
};

function parseList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OpportunitiesAdminClient() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [accessRoles, setAccessRoles] = useState<AccessRole[]>([]);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    title: "",
    roleCode: "",
    department: "",
    opportunityType: "volunteer",
    summary: "",
    description: "",
    requirements: "",
    perks: "",
    payLabel: "",
    status: "open",
    isPublic: true,
    locationCity: "Baltimore",
    locationState: "MD",
    priorityScore: 100,
    displayOrder: 100,
    seasonSlug: "season-1",
    accessRoleId: "",
    assignmentPermissionCodes: "",
    assignmentLogic: "",
  });

  async function load() {
    const [opportunitiesRes, rolesRes] = await Promise.all([
      fetch("/api/epl/admin/opportunities", { cache: "no-store" }),
      fetch("/api/admin/roles", { cache: "no-store" }),
    ]);
    const [opportunitiesJson, rolesJson] = await Promise.all([opportunitiesRes.json(), rolesRes.json()]);
    const json = opportunitiesJson as { opportunities?: Opportunity[]; error?: string };
    if (!opportunitiesRes.ok) {
      setMessage(json.error || "Could not load opportunities.");
      return;
    }
    const next = json.opportunities || [];
    setOpportunities(next);
    if (!selectedId && next[0]?.id) setSelectedId(next[0].id);
    if (rolesRes.ok) {
      setAccessRoles(((rolesJson as { roles?: AccessRole[] }).roles || []).map((role) => ({ id: role.id, name: role.name })));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: opportunities.length,
      open: opportunities.filter((item) => item.status === "open").length,
      public: opportunities.filter((item) => item.is_public !== false).length,
      linkedRoles: opportunities.filter((item) => item.access_role_id).length,
    }),
    [opportunities],
  );

  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.id === selectedId) || null,
    [opportunities, selectedId],
  );

  useEffect(() => {
    if (!selectedOpportunity) return;
    setForm({
      id: selectedOpportunity.id,
      seasonSlug: "season-1",
      title: selectedOpportunity.title || "",
      roleCode: (selectedOpportunity as any).role_code || "",
      department: selectedOpportunity.department || "",
      opportunityType: selectedOpportunity.opportunity_type || "volunteer",
      summary: selectedOpportunity.summary || "",
      description: selectedOpportunity.description || "",
      requirements: (selectedOpportunity.requirements || []).join("\n"),
      perks: (selectedOpportunity.perks || []).join("\n"),
      payLabel: selectedOpportunity.pay_label || "",
      status: selectedOpportunity.status || "open",
      isPublic: selectedOpportunity.is_public !== false,
      locationCity: selectedOpportunity.location_city || "",
      locationState: selectedOpportunity.location_state || "",
      priorityScore: selectedOpportunity.priority_score || 100,
      displayOrder: selectedOpportunity.display_order || 100,
      accessRoleId: selectedOpportunity.access_role_id || "",
      assignmentPermissionCodes: (selectedOpportunity.assignment_permission_codes || []).join(", "),
      assignmentLogic: selectedOpportunity.assignment_logic?.notes || "",
    });
  }, [selectedOpportunity]);

  async function saveOpportunity(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requirements: parseList(form.requirements || ""),
        perks: parseList(form.perks || ""),
        assignmentPermissionCodes: String(form.assignmentPermissionCodes || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save opportunity.");
      return;
    }
    setMessage(form.id ? "Opportunity updated." : "Opportunity created.");
    if (!form.id) {
      setForm({
        title: "",
        roleCode: "",
        department: "",
        opportunityType: "volunteer",
        summary: "",
        description: "",
        requirements: "",
        perks: "",
        payLabel: "",
        status: "open",
        isPublic: true,
        locationCity: "Baltimore",
        locationState: "MD",
        priorityScore: 100,
        displayOrder: 100,
        seasonSlug: "season-1",
        accessRoleId: "",
        assignmentPermissionCodes: "",
        assignmentLogic: "",
      });
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">EPL opportunities</div>
            <h1 className="ev-title">Open roles, review the queue, and keep staffing needs current.</h1>
            <p className="ev-subtitle">
              Use the left queue to track every opening. Use the detail panel to update the listing, link access roles, and control what applicants see.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Roles", stats.total],
              ["Open", stats.open],
              ["Public", stats.public],
              ["Linked access", stats.linkedRoles],
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Live roles</div>
          <div className="mt-4 space-y-3">
            {opportunities.map((opportunity) => (
              <button
                key={opportunity.id}
                type="button"
                onClick={() => setSelectedId(opportunity.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  selectedId === opportunity.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                }`}
              >
                <div className="text-sm uppercase tracking-[0.18em] text-[#caa7ff]">{opportunity.opportunity_type}</div>
                <div className="mt-2 text-lg font-semibold text-white">{opportunity.title}</div>
                <div className="mt-2 text-sm text-white/55">
                  {opportunity.location_city || "Baltimore"} {opportunity.pay_label ? `• ${opportunity.pay_label}` : ""}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">{form.id ? "Edit role" : "Create role"}</div>
          <h2 className="mt-3 text-2xl font-bold text-white">{form.id ? "Update opportunity" : "Open a new opportunity"}</h2>
          <form onSubmit={saveOpportunity} className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 1</div>
              <div className="mt-2 text-lg font-semibold text-white">Role basics</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="Role title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="ev-field" placeholder="Role code" value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <select className="ev-field" value={form.opportunityType} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}>
                <option value="volunteer">Volunteer</option>
                <option value="paid">Paid</option>
              </select>
              </div>
              <input className="ev-field mt-4" placeholder="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              <textarea className="ev-textarea mt-4" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 2</div>
              <div className="mt-2 text-lg font-semibold text-white">Public listing</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <textarea className="ev-textarea" rows={4} placeholder="Requirements, one per line" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
                <textarea className="ev-textarea" rows={4} placeholder="Perks, one per line" value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <input className="ev-field" placeholder="Pay label" value={form.payLabel} onChange={(e) => setForm({ ...form, payLabel: e.target.value })} />
                <input className="ev-field" placeholder="City" value={form.locationCity} onChange={(e) => setForm({ ...form, locationCity: e.target.value })} />
                <input className="ev-field" placeholder="State" value={form.locationState} onChange={(e) => setForm({ ...form, locationState: e.target.value })} />
                <select className="ev-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="filled">Filled</option>
                </select>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <input className="ev-field" type="number" placeholder="Priority" value={form.priorityScore} onChange={(e) => setForm({ ...form, priorityScore: Number(e.target.value || 100) })} />
                <input className="ev-field" type="number" placeholder="Display order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value || 100) })} />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                  <input type="checkbox" checked={Boolean(form.isPublic)} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                  Publicly visible
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 3</div>
              <div className="mt-2 text-lg font-semibold text-white">Assignment rules</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
              <select className="ev-field" value={form.accessRoleId} onChange={(e) => setForm({ ...form, accessRoleId: e.target.value })}>
                <option value="">No linked access role</option>
                {accessRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <input
                className="ev-field"
                placeholder="Assignment permission codes, comma separated"
                value={form.assignmentPermissionCodes}
                onChange={(e) => setForm({ ...form, assignmentPermissionCodes: e.target.value })}
              />
              </div>
              <textarea
                className="ev-textarea mt-4"
                rows={3}
                placeholder="Assignment logic or onboarding notes"
                value={form.assignmentLogic}
                onChange={(e) => setForm({ ...form, assignmentLogic: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="ev-button-primary">{form.id ? "Save opportunity" : "Create opportunity"}</button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setForm({
                      title: "",
                      roleCode: "",
                      department: "",
                      opportunityType: "volunteer",
                      summary: "",
                      description: "",
                      requirements: "",
                      perks: "",
                      payLabel: "",
                      status: "open",
                      isPublic: true,
                      locationCity: "Baltimore",
                      locationState: "MD",
                      priorityScore: 100,
                      displayOrder: 100,
                      seasonSlug: "season-1",
                    });
                  }}
                  className="ev-button-secondary"
                >
                  New opportunity
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
