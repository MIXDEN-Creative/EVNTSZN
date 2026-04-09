"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOperatorRoleOptions,
  getOrganizerClassificationLabel,
  getOrganizerClassificationOptions,
} from "@/lib/operator-access";

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
const organizerClassificationOptions = getOrganizerClassificationOptions();
const primaryRoles = ["attendee", "organizer", "venue", "scanner", "admin"];

const emptyCreateForm = {
  email: "",
  full_name: "",
  password: "",
  primary_role: "attendee",
  role_key: "host",
  organizer_classification: "evntszn_host",
  network_status: "active",
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
};

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
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editor, setEditor] = useState<Record<string, any> | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [query, setQuery] = useState("");

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

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((user) =>
      [
        user.full_name,
        user.primary_role,
        user.city,
        user.state,
        user.operator_profile?.role_key,
        user.operator_profile?.job_title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      scanner: users.filter((user) => Boolean(user.operator_profile?.can_access_scanner)).length,
      hq: users.filter((user) => user.admin_membership?.roles?.includes("hq_operator")).length,
    }),
    [users],
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
      organizer_classification:
        selectedUser.operator_profile?.organizer_classification || "evntszn_host",
      network_status: selectedUser.operator_profile?.network_status || "active",
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
    setSavingCreate(true);
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
    setSavingCreate(false);
    if (!res.ok) {
      setMessage(data.error || "Could not create user.");
      return;
    }

    setCreateForm(emptyCreateForm);
    setMessage("User created.");
    await load();
  }

  async function saveSelectedUser() {
    if (!selectedUser || !editor) return;
    setSavingUser(true);
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
    setSavingUser(false);
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
            <div className="ev-kicker">User directory</div>
            <h1 className="ev-title">Create staff accounts, assign scope, and keep access clean.</h1>
            <p className="ev-subtitle">
              Use this workspace to provision operator accounts, define the operating track, and control who can reach dashboards, modules, and scanner access.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Profiles", stats.total],
              ["Active", stats.active],
              ["Scanner", stats.scanner],
              ["HQ roles", stats.hq],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-meta-card">
                <div className="ev-meta-label">{label}</div>
                <div className="ev-meta-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Create user</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Provision a new internal account</h2>
            <p className="mt-2 text-sm text-white/60">
              Move left to right: identity first, then access, then scope. Advanced notes stay collapsed until needed.
            </p>

            <form onSubmit={createUser} className="mt-6 grid gap-6">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 1</div>
                <div className="mt-2 text-lg font-semibold text-white">Identity</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    className="ev-field"
                    placeholder="Full name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    type="email"
                    placeholder="Email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 2</div>
                <div className="mt-2 text-lg font-semibold text-white">Access</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select
                    className="ev-field"
                    value={createForm.primary_role}
                    onChange={(e) => setCreateForm({ ...createForm, primary_role: e.target.value })}
                  >
                    {primaryRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <select
                    className="ev-field"
                    value={createForm.role_key}
                    onChange={(e) => setCreateForm({ ...createForm, role_key: e.target.value })}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="ev-field"
                    value={createForm.organizer_classification}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, organizer_classification: e.target.value })
                    }
                  >
                    {organizerClassificationOptions.map((classification) => (
                      <option key={classification.value} value={classification.value}>
                        {classification.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="ev-field"
                    value={createForm.network_status}
                    onChange={(e) => setCreateForm({ ...createForm, network_status: e.target.value })}
                  >
                    {["prospect", "active", "paused", "alumni"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 3</div>
                <div className="mt-2 text-lg font-semibold text-white">Scope</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    className="ev-field"
                    placeholder="City"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="State"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="Job title"
                    value={createForm.job_title}
                    onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="Functions, comma separated"
                    value={createForm.functions}
                    onChange={(e) => setCreateForm({ ...createForm, functions: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="City scope"
                    value={createForm.city_scope}
                    onChange={(e) => setCreateForm({ ...createForm, city_scope: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="Dashboards"
                    value={createForm.dashboard_access}
                    onChange={(e) => setCreateForm({ ...createForm, dashboard_access: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="Surfaces"
                    value={createForm.surface_access}
                    onChange={(e) => setCreateForm({ ...createForm, surface_access: e.target.value })}
                  />
                  <input
                    className="ev-field"
                    placeholder="Modules"
                    value={createForm.module_access}
                    onChange={(e) => setCreateForm({ ...createForm, module_access: e.target.value })}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["can_manage_content", "Content"],
                    ["can_manage_discovery", "Discovery"],
                    ["can_manage_store", "Store"],
                    ["can_manage_sponsors", "Sponsors"],
                    ["can_access_scanner", "Scanner"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/78"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(createForm[key as keyof typeof createForm])}
                        onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.checked })}
                      />
                      {label} access
                    </label>
                  ))}
                </div>

                <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-white">Advanced</summary>
                  <div className="mt-4 grid gap-4">
                    <input
                      className="ev-field"
                      type="password"
                      placeholder="Temporary password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                    <textarea
                      className="ev-textarea"
                      rows={2}
                      placeholder="Approval authority"
                      value={createForm.approval_authority}
                      onChange={(e) => setCreateForm({ ...createForm, approval_authority: e.target.value })}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <textarea
                        className="ev-textarea"
                        rows={2}
                        placeholder="Team scope"
                        value={createForm.team_scope}
                        onChange={(e) => setCreateForm({ ...createForm, team_scope: e.target.value })}
                      />
                      <textarea
                        className="ev-textarea"
                        rows={2}
                        placeholder="Sponsor scope"
                        value={createForm.sponsor_scope}
                        onChange={(e) => setCreateForm({ ...createForm, sponsor_scope: e.target.value })}
                      />
                    </div>
                  </div>
                </details>
              </div>

              <button type="submit" disabled={savingCreate} className="ev-button-primary">
                {savingCreate ? "Creating..." : "Create user"}
              </button>
            </form>
          </section>
        </section>

        <section className="grid gap-6">
          <section className="ev-panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="ev-section-kicker">Roster</div>
                <div className="mt-2 text-xl font-bold text-white">Find an operator and update scope</div>
              </div>
              <input
                className="ev-field max-w-xs"
                placeholder="Search name, role, city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[320px_1fr]">
              <div className="space-y-3">
                {loading ? <div className="text-sm text-white/60">Loading users...</div> : null}
                {!loading && !filteredUsers.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/55">
                    No users match the current search.
                  </div>
                ) : null}
                {filteredUsers.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(user.user_id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      user.user_id === selectedUserId
                        ? "border-[#A259FF]/40 bg-[#A259FF]/10"
                        : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-base font-semibold text-white">{user.full_name || user.user_id}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                      {user.operator_profile?.role_key || user.primary_role}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                      {getOrganizerClassificationLabel(
                        String(user.operator_profile?.organizer_classification || "evntszn_host"),
                      )}
                    </div>
                    <div className="mt-2 text-sm text-white/55">
                      {user.city || "No city"}
                      {user.state ? `, ${user.state}` : ""}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                {!selectedUser || !editor ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
                    Select a user to update their role, operating track, scope, and access flags.
                  </div>
                ) : (
                  <div className="grid gap-6">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="ev-section-kicker">Selected user</div>
                          <h2 className="mt-3 text-2xl font-bold text-white">
                            {selectedUser.full_name || selectedUser.user_id}
                          </h2>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                            <span>
                              {selectedUser.admin_membership?.isOwner
                                ? "Founder override"
                                : selectedUser.operator_preset?.label || "Custom operator"}
                            </span>
                            <span>{selectedUser.is_active ? "active" : "disabled"}</span>
                            <span>
                              {getOrganizerClassificationLabel(
                                String(editor.organizer_classification || "evntszn_host"),
                              )}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void saveSelectedUser()}
                          disabled={savingUser}
                          className="ev-button-primary"
                        >
                          {savingUser ? "Saving..." : "Save user"}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Identity</div>
                        <div className="mt-4 grid gap-4">
                          <input className="ev-field" value={editor.full_name} onChange={(e) => setEditor({ ...editor, full_name: e.target.value })} />
                          <div className="grid gap-4 md:grid-cols-2">
                            <input className="ev-field" value={editor.city} placeholder="City" onChange={(e) => setEditor({ ...editor, city: e.target.value })} />
                            <input className="ev-field" value={editor.state} placeholder="State" onChange={(e) => setEditor({ ...editor, state: e.target.value })} />
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <input className="ev-field" value={editor.phone} placeholder="Phone" onChange={(e) => setEditor({ ...editor, phone: e.target.value })} />
                            <input className="ev-field" value={editor.job_title} placeholder="Job title" onChange={(e) => setEditor({ ...editor, job_title: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Access</div>
                        <div className="mt-4 grid gap-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <select className="ev-field" value={editor.primary_role} onChange={(e) => setEditor({ ...editor, primary_role: e.target.value })}>
                              {primaryRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <select className="ev-field" value={editor.role_key} onChange={(e) => setEditor({ ...editor, role_key: e.target.value })}>
                              {roleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            <select className="ev-field" value={editor.organizer_classification} onChange={(e) => setEditor({ ...editor, organizer_classification: e.target.value })}>
                              {organizerClassificationOptions.map((classification) => (
                                <option key={classification.value} value={classification.value}>
                                  {classification.label}
                                </option>
                              ))}
                            </select>
                            <select className="ev-field" value={editor.network_status} onChange={(e) => setEditor({ ...editor, network_status: e.target.value })}>
                              {["prospect", "active", "paused", "alumni"].map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {[
                              ["can_manage_content", "Content"],
                              ["can_manage_discovery", "Discovery"],
                              ["can_manage_store", "Store"],
                              ["can_manage_sponsors", "Sponsors"],
                              ["can_access_scanner", "Scanner"],
                              ["is_active", "User active"],
                            ].map(([key, label]) => (
                              <label
                                key={key}
                                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(editor[key])}
                                  onChange={(e) => setEditor({ ...editor, [key]: e.target.checked })}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Scope</div>
                        <div className="mt-4 grid gap-4">
                          <input className="ev-field" value={editor.functions} placeholder="Functions" onChange={(e) => setEditor({ ...editor, functions: e.target.value })} />
                          <input className="ev-field" value={editor.city_scope} placeholder="City scope" onChange={(e) => setEditor({ ...editor, city_scope: e.target.value })} />
                          <input className="ev-field" value={editor.dashboard_access} placeholder="Dashboard access" onChange={(e) => setEditor({ ...editor, dashboard_access: e.target.value })} />
                          <input className="ev-field" value={editor.surface_access} placeholder="Surface access" onChange={(e) => setEditor({ ...editor, surface_access: e.target.value })} />
                          <input className="ev-field" value={editor.module_access} placeholder="Module access" onChange={(e) => setEditor({ ...editor, module_access: e.target.value })} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-white/45">Review</div>
                        <div className="mt-3 space-y-2 text-sm text-white/72">
                          <div>Approval authority: {editor.approval_authority || "None assigned"}</div>
                          <div>Team scope: {editor.team_scope || "No team scope"}</div>
                          <div>Sponsor scope: {editor.sponsor_scope || "No sponsor scope"}</div>
                          <div>Functions: {editor.functions || "No function tags"}</div>
                          <div>Dashboard access: {editor.dashboard_access || "No dashboards set"}</div>
                        </div>
                        <textarea
                          className="ev-textarea mt-4"
                          rows={4}
                          value={editor.notes}
                          placeholder="Internal notes"
                          onChange={(e) => setEditor({ ...editor, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
