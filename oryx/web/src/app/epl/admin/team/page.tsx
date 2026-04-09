"use client";

import { useEffect, useMemo, useState } from "react";

type Permission = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  category: string;
  is_system: boolean;
};

type Role = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  role_permissions?: {
    permission_id: string;
    permissions: Permission | Permission[] | null;
  }[];
};

type TeamMember = {
  user_id: string;
  is_active: boolean;
  profile: {
    user_id: string;
    full_name: string | null;
    primary_role: string | null;
    city: string | null;
    state: string | null;
    is_active: boolean;
  } | null;
  roles: {
    id: string;
    role_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    role: Role | null;
  }[];
};

type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  role: Role | null;
};

type DirectoryUser = {
  user_id: string;
  full_name: string | null;
  primary_role: string | null;
  city: string | null;
  state: string | null;
  operator_profile?: {
    role_key?: string | null;
  } | null;
};

const emptyRoleForm = {
  id: "",
  name: "",
  code: "",
  description: "",
  isActive: true,
  permissionIds: [] as string[],
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function getInviteState(invite: Invite) {
  if (invite.status !== "pending") return invite.status;
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return "pending";
}

function normalizeRolePermissions(role: Role) {
  return (role.role_permissions || [])
    .map((record) => {
      const permission = Array.isArray(record.permissions) ? record.permissions[0] : record.permissions;
      return permission?.id || null;
    })
    .filter(Boolean) as string[];
}

export default function AdminTeamPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [inviteForm, setInviteForm] = useState({ fullName: "", email: "", roleId: "" });
  const [savingRole, setSavingRole] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage("");

    const [rolesRes, permissionsRes, teamRes, invitesRes, usersRes] = await Promise.all([
      fetch("/api/admin/roles", { cache: "no-store" }),
      fetch("/api/admin/permissions", { cache: "no-store" }),
      fetch("/api/admin/team", { cache: "no-store" }),
      fetch("/api/admin/invites", { cache: "no-store" }),
      fetch("/api/admin/operator-users", { cache: "no-store" }),
    ]);

    const [rolesJson, permissionsJson, teamJson, invitesJson, usersJson] = await Promise.all([
      rolesRes.json(),
      permissionsRes.json(),
      teamRes.json(),
      invitesRes.json(),
      usersRes.json(),
    ]);

    if (!rolesRes.ok) {
      setMessage((rolesJson as { error?: string }).error || "Could not load roles.");
    } else {
      setRoles((rolesJson as { roles?: Role[] }).roles || []);
    }

    if (permissionsRes.ok) {
      setPermissions((permissionsJson as { permissions?: Permission[] }).permissions || []);
    }

    if (teamRes.ok) {
      setTeam((teamJson as { team?: TeamMember[] }).team || []);
    }

    if (invitesRes.ok) {
      setInvites((invitesJson as { invites?: Invite[] }).invites || []);
    }

    if (usersRes.ok) {
      setDirectory((usersJson as { users?: DirectoryUser[] }).users || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const permissionsByCategory = useMemo(() => {
    const grouped = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const current = grouped.get(permission.category) || [];
      current.push(permission);
      grouped.set(permission.category, current);
    }
    return Array.from(grouped.entries());
  }, [permissions]);

  const directoryOptions = useMemo(
    () =>
      directory.map((user) => ({
        value: user.user_id,
        label:
          user.full_name ||
          [user.primary_role, user.city].filter(Boolean).join(" • ") ||
          user.user_id,
      })),
    [directory],
  );

  function beginRoleEdit(role: Role) {
    setRoleForm({
      id: role.id,
      name: role.name,
      code: role.code || "",
      description: role.description || "",
      isActive: role.is_active,
      permissionIds: normalizeRolePermissions(role),
    });
  }

  function resetRoleForm() {
    setRoleForm(emptyRoleForm);
  }

  function togglePermission(permissionId: string) {
    setRoleForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  }

  async function saveRole(event: React.FormEvent) {
    event.preventDefault();
    setSavingRole(true);
    setMessage("");

    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roleForm),
    });

    const json = (await response.json()) as { error?: string; resentExisting?: boolean };
    setSavingRole(false);

    if (!response.ok) {
      setMessage(json.error || "Could not save role.");
      return;
    }

    setMessage(roleForm.id ? "Role updated." : "Role created.");
    resetRoleForm();
    await loadData();
  }

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault();
    setSendingInvite(true);
    setMessage("");

    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteForm.email,
        full_name: inviteForm.fullName,
        role_id: inviteForm.roleId,
      }),
    });

    const json = (await response.json()) as { error?: string; resentExisting?: boolean };
    setSendingInvite(false);

    if (!response.ok) {
      setMessage(json.error || "Could not send invite.");
      return;
    }

    setInviteForm({ fullName: "", email: "", roleId: "" });
    setMessage(json.resentExisting ? "Existing pending invite refreshed and resent." : "Invite sent.");
    await loadData();
  }

  async function assignRole() {
    if (!selectedUserId || !assignRoleId) {
      setMessage("Pick a user and role first.");
      return;
    }

    setAssigningRole(true);
    setMessage("");
    const response = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assignRole",
        userId: selectedUserId,
        roleId: assignRoleId,
      }),
    });

    const json = (await response.json()) as { error?: string };
    setAssigningRole(false);

    if (!response.ok) {
      setMessage(json.error || "Could not assign role.");
      return;
    }

    setMessage("Role assigned.");
    setAssignRoleId("");
    await loadData();
  }

  async function updateUserRole(action: "toggleRole" | "removeRole", userRoleId: string, isActive?: boolean) {
    const response = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userRoleId, isActive }),
    });

    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(json.error || "Could not update access.");
      return;
    }

    setMessage(action === "removeRole" ? "Role removed." : "Role updated.");
    await loadData();
  }

  async function updateInvite(inviteId: string, action: "resend" | "revoke") {
    const response = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, action }),
    });

    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(json.error || "Could not update invite.");
      return;
    }

    setMessage(action === "resend" ? "Invite resent." : "Invite revoked.");
    await loadData();
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-7xl text-white/60">Loading team and access controls...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Team & access</div>
            <h1 className="ev-title">Create roles, send invites, and keep internal access clean.</h1>
            <p className="ev-subtitle">
              This is the control point for role setup, internal onboarding, and active access. Create roles, send invite-based access, and review who can reach each workspace.
            </p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="ev-panel p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Active roles</div>
          <div className="mt-2 text-3xl font-black text-white">{roles.filter((role) => role.is_active).length}</div>
        </div>
        <div className="ev-panel p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Pending invites</div>
          <div className="mt-2 text-3xl font-black text-white">{invites.filter((invite) => getInviteState(invite) === "pending").length}</div>
        </div>
        <div className="ev-panel p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Assigned users</div>
          <div className="mt-2 text-3xl font-black text-white">{team.length}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Roles & permissions</div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">{roleForm.id ? "Edit role" : "Create role"}</h2>
            {roleForm.id ? (
              <button type="button" onClick={resetRoleForm} className="ev-button-secondary">
                New role
              </button>
            ) : null}
          </div>

          <form onSubmit={saveRole} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="ev-field"
                placeholder="Role name"
                value={roleForm.name}
                onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <input
                className="ev-field"
                placeholder="Role code"
                value={roleForm.code}
                onChange={(event) => setRoleForm((current) => ({ ...current, code: event.target.value }))}
              />
            </div>

            <textarea
              className="ev-textarea"
              rows={3}
              placeholder="Role description"
              value={roleForm.description}
              onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
            />

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={roleForm.isActive}
                onChange={(event) => setRoleForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Role is active
            </label>

            <div className="grid gap-4 xl:grid-cols-2">
              {permissionsByCategory.map(([category, categoryPermissions]) => (
                <div key={category} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">{category}</div>
                  <div className="mt-3 space-y-3">
                    {categoryPermissions.map((permission) => (
                      <label key={permission.id} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={roleForm.permissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-white">{permission.label}</span>
                          <span className="block text-xs text-white/55">{permission.code}</span>
                          {permission.description ? <span className="mt-1 block text-xs text-white/48">{permission.description}</span> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="ev-button-primary" disabled={savingRole}>
                {savingRole ? "Saving role..." : roleForm.id ? "Save role" : "Create role"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="ev-section-kicker">Current roles</div>
            <div className="mt-4 space-y-3">
              {roles.map((role) => {
                const permissionCount = normalizeRolePermissions(role).length;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => beginRoleEdit(role)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-[#A259FF]/35 hover:bg-[#A259FF]/8"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-white">{role.name}</div>
                      {role.is_system ? <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/52">System</span> : null}
                      {!role.is_active ? <span className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-red-200">Inactive</span> : null}
                    </div>
                    <div className="mt-1 text-sm text-white/58">{role.description || "No role description yet."}</div>
                    <div className="mt-3 text-xs uppercase tracking-[0.22em] text-[#caa7ff]">{permissionCount} permissions</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Invite access</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Send role-based onboarding</h2>
            <form onSubmit={sendInvite} className="mt-5 grid gap-4">
              <input
                className="ev-field"
                placeholder="Full name"
                value={inviteForm.fullName}
                onChange={(event) => setInviteForm((current) => ({ ...current, fullName: event.target.value }))}
              />
              <input
                className="ev-field"
                type="email"
                placeholder="Email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <select
                className="ev-field"
                value={inviteForm.roleId}
                onChange={(event) => setInviteForm((current) => ({ ...current, roleId: event.target.value }))}
                required
              >
                <option value="">Select role</option>
                {roles.filter((role) => role.is_active).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="ev-button-primary" disabled={sendingInvite}>
                {sendingInvite ? "Sending invite..." : "Send invite"}
              </button>
            </form>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Assign existing user</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Attach roles to current platform users</h2>
            <div className="mt-5 grid gap-4">
              <select className="ev-field" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                <option value="">Select a user</option>
                {directoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className="ev-field" value={assignRoleId} onChange={(event) => setAssignRoleId(event.target.value)}>
                <option value="">Select a role</option>
                {roles.filter((role) => role.is_active).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button type="button" className="ev-button-secondary" onClick={assignRole} disabled={assigningRole}>
                {assigningRole ? "Assigning..." : "Assign role"}
              </button>
            </div>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Pending invites</div>
            <div className="mt-4 space-y-3">
              {invites.length ? (
                invites.map((invite) => (
                  <div key={invite.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    {(() => {
                      const inviteState = getInviteState(invite);
                      return (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-white">{invite.full_name || invite.email}</div>
                        <div className="text-sm text-white/58">{invite.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[#caa7ff]">{invite.role?.name || "No role"}</span>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-white/52">{inviteState}</span>
                        </div>
                        <div className="mt-3 text-xs text-white/45">
                          Created {formatDate(invite.created_at)} • Expires {formatDate(invite.expires_at)} • Accepted {formatDate(invite.accepted_at)}
                        </div>
                      </div>
                      {inviteState === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="ev-button-secondary" onClick={() => updateInvite(invite.id, "resend")}>
                            Resend
                          </button>
                          <button type="button" className="rounded-2xl border border-red-400/25 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/10" onClick={() => updateInvite(invite.id, "revoke")}>
                            Revoke
                          </button>
                        </div>
                      ) : null}
                    </div>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">
                  No invites yet. Send onboarding from here when a role is ready.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="ev-panel mt-6 p-6">
        <div className="ev-section-kicker">Active access</div>
        <h2 className="mt-3 text-2xl font-bold text-white">Current admin team</h2>
        <div className="mt-5 space-y-4">
          {team.length ? (
            team.map((member) => (
              <div key={member.user_id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">{member.profile?.full_name || member.user_id}</div>
                    <div className="text-sm text-white/55">
                      {member.profile?.primary_role || "member"}{member.profile?.city ? ` • ${member.profile.city}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {member.roles.map((assignment) => (
                      <div key={assignment.id} className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{assignment.role?.name || "Unknown role"}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#caa7ff]">
                              {assignment.is_active ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="ev-button-secondary"
                            onClick={() => updateUserRole("toggleRole", assignment.id, !assignment.is_active)}
                          >
                            {assignment.is_active ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            className="rounded-2xl border border-red-400/25 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/10"
                            onClick={() => updateUserRole("removeRole", assignment.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">
              No active access assignments yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
