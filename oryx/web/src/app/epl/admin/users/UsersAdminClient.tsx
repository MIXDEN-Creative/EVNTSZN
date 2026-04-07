"use client";

import { useEffect, useMemo, useState } from "react";
import { getOperatorRoleOptions } from "@/lib/operator-access";

type PlatformUser = {
  user_id: string;
  full_name: string | null;
  primary_role: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_active: boolean;
  notes?: string | null;
  operator_profile?: Record<string, any> | null;
  operator_preset?: { label?: string } | null;
  admin_membership?: { isOwner?: boolean; roles?: string[] } | null;
};

const roleOptions = getOperatorRoleOptions();
const primaryRoles = ["attendee", "organizer", "venue", "scanner", "admin"];

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export default function UsersAdminClient() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    password: "",
    primary_role: "attendee",
    role_key: "host",
    city: "",
    state: "",
    job_title: "",
    functions: "",
    city_scope: "",
    dashboard_access: "",
    surface_access: "",
    module_access: "",
    approval_authority: "",
    team_scope: "",
    sponsor_scope: "",
    can_manage_content: false,
    can_manage_discovery: false,
    can_manage_store: false,
    can_manage_sponsors: false,
    can_access_scanner: false,
  });
  const [editor, setEditor] = useState<Record<string, any> | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/operator-users", { cache: "no-store" });
    const data = (await res.json()) as { users?: PlatformUser[]; error?: string };
    if (!res.ok) {
      setMessage(data.error || "Could not load operator users.");
      setLoading(false);
      return;
    }

    const nextUsers = data.users || [];
    setUsers(nextUsers);
    setSelectedUserId((current) => current || nextUsers[0]?.user_id || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) || null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (!selectedUser) {
      setEditor(null);
      return;
    }

    setEditor({
      full_name: selectedUser.full_name || "",
      primary_role: selectedUser.primary_role || "attendee",
      city: selectedUser.city || "",
      state: selectedUser.state || "",
      phone: selectedUser.phone || "",
      notes: selectedUser.notes || "",
      role_key: selectedUser.operator_profile?.role_key || "host",
      job_title: selectedUser.operator_profile?.job_title || "",
      functions: stringifyList(selectedUser.operator_profile?.functions),
      city_scope: stringifyList(selectedUser.operator_profile?.city_scope),
      dashboard_access: stringifyList(selectedUser.operator_profile?.dashboard_access),
      surface_access: stringifyList(selectedUser.operator_profile?.surface_access),
      module_access: stringifyList(selectedUser.operator_profile?.module_access),
      approval_authority: stringifyList(selectedUser.operator_profile?.approval_authority),
      team_scope: stringifyList(selectedUser.operator_profile?.team_scope),
      sponsor_scope: stringifyList(selectedUser.operator_profile?.sponsor_scope),
      can_manage_content: Boolean(selectedUser.operator_profile?.can_manage_content),
      can_manage_discovery: Boolean(selectedUser.operator_profile?.can_manage_discovery),
      can_manage_store: Boolean(selectedUser.operator_profile?.can_manage_store),
      can_manage_sponsors: Boolean(selectedUser.operator_profile?.can_manage_sponsors),
      can_access_scanner: Boolean(selectedUser.operator_profile?.can_access_scanner),
      is_active: Boolean(selectedUser.is_active),
    });
  }, [selectedUser]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    const res = await fetch("/api/admin/operator-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        functions: parseList(createForm.functions),
        city_scope: parseList(createForm.city_scope),
        dashboard_access: parseList(createForm.dashboard_access),
        surface_access: parseList(createForm.surface_access),
        module_access: parseList(createForm.module_access),
        approval_authority: parseList(createForm.approval_authority),
        team_scope: parseList(createForm.team_scope),
        sponsor_scope: parseList(createForm.sponsor_scope),
      }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "Could not create user.");
      return;
    }

    setCreateForm({
      email: "",
      full_name: "",
      password: "",
      primary_role: "attendee",
      role_key: "host",
      city: "",
      state: "",
      job_title: "",
      functions: "",
      city_scope: "",
      dashboard_access: "",
      surface_access: "",
      module_access: "",
      approval_authority: "",
      team_scope: "",
      sponsor_scope: "",
      can_manage_content: false,
      can_manage_discovery: false,
      can_manage_store: false,
      can_manage_sponsors: false,
      can_access_scanner: false,
    });
    await load();
  }

  async function saveSelectedUser() {
    if (!selectedUser || !editor) return;
    setMessage("");

    const res = await fetch(`/api/admin/operator-users/${selectedUser.user_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editor,
        functions: parseList(editor.functions || ""),
        city_scope: parseList(editor.city_scope || ""),
        dashboard_access: parseList(editor.dashboard_access || ""),
        surface_access: parseList(editor.surface_access || ""),
        module_access: parseList(editor.module_access || ""),
        approval_authority: parseList(editor.approval_authority || ""),
        team_scope: parseList(editor.team_scope || ""),
        sponsor_scope: parseList(editor.sponsor_scope || ""),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "Could not update user.");
      return;
    }

    setMessage("Operator profile updated.");
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Operator directory</div>
            <h1 className="ev-title">Run access, job function, and operating scope from one user surface.</h1>
            <p className="ev-subtitle">
              Provision users, set role and job identity, define city and module scope, and control who can access admin, ops, scanner, content, discovery, store, and sponsor workflows.
            </p>
          </div>
          <div className="ev-hero-meta">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Visible users</div>
              <div className="ev-meta-value">{users.length} profiles loaded into the command layer.</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Operator presets</div>
              <div className="ev-meta-value">{roleOptions.length} role presets available for assignment and override.</div>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Create user</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Provision a platform operator or staff account</h2>
          <form onSubmit={createUser} className="mt-5 grid gap-4">
            <input className="ev-field" placeholder="Full name" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
            <input className="ev-field" type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
            <input className="ev-field" type="password" placeholder="Temporary password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
            <div className="grid gap-4 md:grid-cols-2">
              <select className="ev-field" value={createForm.primary_role} onChange={(e) => setCreateForm({ ...createForm, primary_role: e.target.value })}>
                {primaryRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <select className="ev-field" value={createForm.role_key} onChange={(e) => setCreateForm({ ...createForm, role_key: e.target.value })}>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <input className="ev-field" placeholder="Job title" value={createForm.job_title} onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })} />
            <input className="ev-field" placeholder="Functions (comma separated)" value={createForm.functions} onChange={(e) => setCreateForm({ ...createForm, functions: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="City" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} />
              <input className="ev-field" placeholder="State" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} />
            </div>
            <textarea className="ev-textarea" rows={2} placeholder="City scope (comma separated)" value={createForm.city_scope} onChange={(e) => setCreateForm({ ...createForm, city_scope: e.target.value })} />
            <textarea className="ev-textarea" rows={2} placeholder="Dashboards (hq, admin, city, ops, scanner, hosts, analytics...)" value={createForm.dashboard_access} onChange={(e) => setCreateForm({ ...createForm, dashboard_access: e.target.value })} />
            <textarea className="ev-textarea" rows={2} placeholder="Surfaces (admin, hq, ops, scanner, hosts...)" value={createForm.surface_access} onChange={(e) => setCreateForm({ ...createForm, surface_access: e.target.value })} />
            <textarea className="ev-textarea" rows={2} placeholder="Modules (users, discovery, epl, sponsors, store...)" value={createForm.module_access} onChange={(e) => setCreateForm({ ...createForm, module_access: e.target.value })} />
            <textarea className="ev-textarea" rows={2} placeholder="Approval authority (host, organizer, partner, all...)" value={createForm.approval_authority} onChange={(e) => setCreateForm({ ...createForm, approval_authority: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <textarea className="ev-textarea" rows={2} placeholder="Team scope" value={createForm.team_scope} onChange={(e) => setCreateForm({ ...createForm, team_scope: e.target.value })} />
              <textarea className="ev-textarea" rows={2} placeholder="Sponsor scope" value={createForm.sponsor_scope} onChange={(e) => setCreateForm({ ...createForm, sponsor_scope: e.target.value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["can_manage_content", "Content"],
                ["can_manage_discovery", "Discovery"],
                ["can_manage_store", "Store"],
                ["can_manage_sponsors", "Sponsors"],
                ["can_access_scanner", "Scanner"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 text-sm text-white/72">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm[key as keyof typeof createForm])}
                    onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.checked })}
                  />
                  {label} capability
                </label>
              ))}
            </div>
            <button type="submit" className="ev-button-primary">Create user</button>
          </form>
        </section>

        <section className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <section className="ev-panel p-5">
              <div className="ev-section-kicker">Roster</div>
              <div className="mt-4 space-y-3">
                {loading ? <div className="text-white/60">Loading users...</div> : null}
                {users.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(user.user_id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      user.user_id === selectedUserId
                        ? "border-[#A259FF]/40 bg-[#A259FF]/10"
                        : "border-white/10 bg-black/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-base font-semibold text-white">{user.full_name || user.user_id}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                      {user.operator_profile?.role_key || user.primary_role}
                    </div>
                    <div className="mt-2 text-sm text-white/55">
                      {user.city || "No city"}{user.state ? `, ${user.state}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="ev-panel p-6">
              {!selectedUser || !editor ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
                  Select a user to edit role, job, functions, and scope.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="ev-section-kicker">Selected operator</div>
                      <h2 className="mt-3 text-2xl font-bold text-white">{selectedUser.full_name || selectedUser.user_id}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                        <span>{selectedUser.admin_membership?.isOwner ? "Founder override" : selectedUser.operator_preset?.label || "Custom operator"}</span>
                        <span>{selectedUser.is_active ? "active" : "disabled"}</span>
                        {selectedUser.admin_membership?.roles?.map((role) => (
                          <span key={role}>{role}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={saveSelectedUser} className="ev-button-primary">
                      Save changes
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <input className="ev-field" value={editor.full_name} onChange={(e) => setEditor({ ...editor, full_name: e.target.value })} />
                    <select className="ev-field" value={editor.primary_role} onChange={(e) => setEditor({ ...editor, primary_role: e.target.value })}>
                      {primaryRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <select className="ev-field" value={editor.role_key} onChange={(e) => setEditor({ ...editor, role_key: e.target.value })}>
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <input className="ev-field" value={editor.job_title} placeholder="Job title" onChange={(e) => setEditor({ ...editor, job_title: e.target.value })} />
                    <input className="ev-field" value={editor.city} placeholder="City" onChange={(e) => setEditor({ ...editor, city: e.target.value })} />
                    <input className="ev-field" value={editor.state} placeholder="State" onChange={(e) => setEditor({ ...editor, state: e.target.value })} />
                    <input className="ev-field" value={editor.phone} placeholder="Phone" onChange={(e) => setEditor({ ...editor, phone: e.target.value })} />
                    <input className="ev-field" value={editor.notes} placeholder="Internal notes" onChange={(e) => setEditor({ ...editor, notes: e.target.value })} />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <textarea className="ev-textarea" rows={3} value={editor.functions} placeholder="Functions" onChange={(e) => setEditor({ ...editor, functions: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} value={editor.city_scope} placeholder="City scope" onChange={(e) => setEditor({ ...editor, city_scope: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} value={editor.dashboard_access} placeholder="Dashboard access" onChange={(e) => setEditor({ ...editor, dashboard_access: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} value={editor.surface_access} placeholder="Surface access" onChange={(e) => setEditor({ ...editor, surface_access: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} value={editor.module_access} placeholder="Module access" onChange={(e) => setEditor({ ...editor, module_access: e.target.value })} />
                    <textarea className="ev-textarea" rows={3} value={editor.approval_authority} placeholder="Approval authority" onChange={(e) => setEditor({ ...editor, approval_authority: e.target.value })} />
                    <textarea className="ev-textarea" rows={2} value={editor.team_scope} placeholder="Team scope" onChange={(e) => setEditor({ ...editor, team_scope: e.target.value })} />
                    <textarea className="ev-textarea" rows={2} value={editor.sponsor_scope} placeholder="Sponsor scope" onChange={(e) => setEditor({ ...editor, sponsor_scope: e.target.value })} />
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      ["can_manage_content", "Content control"],
                      ["can_manage_discovery", "Discovery control"],
                      ["can_manage_store", "Store control"],
                      ["can_manage_sponsors", "Sponsors control"],
                      ["can_access_scanner", "Scanner access"],
                      ["is_active", "User active"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/78">
                        <input
                          type="checkbox"
                          checked={Boolean(editor[key])}
                          onChange={(e) => setEditor({ ...editor, [key]: e.target.checked })}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Permission summary</div>
                      <div className="mt-3 text-sm leading-7 text-white/72">
                        <div>Dashboards: {editor.dashboard_access || "None assigned"}</div>
                        <div>Surfaces: {editor.surface_access || "None assigned"}</div>
                        <div>Modules: {editor.module_access || "None assigned"}</div>
                        <div>Approvals: {editor.approval_authority || "No approval authority"}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Operating identity</div>
                      <div className="mt-3 text-sm leading-7 text-white/72">
                        <div>Role: {editor.role_key}</div>
                        <div>Job title: {editor.job_title || "Not assigned"}</div>
                        <div>Functions: {editor.functions || "None assigned"}</div>
                        <div>City scope: {editor.city_scope || "No city scope"}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
