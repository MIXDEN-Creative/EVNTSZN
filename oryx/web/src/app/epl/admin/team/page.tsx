"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CAPABILITY_GROUPS,
  PRIMARY_ROLE_OPTIONS,
  ROLE_SUBTYPE_OPTIONS,
  ROLE_SCOPE_OPTIONS,
  buildPermissionCodesFromCapabilityGroups,
  getCapabilityGroup,
  getPrimaryRoleOption,
  getRoleSubtypeOptions,
  getScopeOptions,
  inferCapabilityGroupsFromPermissionCodes,
  inferPrimaryRole,
  normalizeCapabilityGroups,
  summarizeCapabilityGroups,
  summarizeScope,
} from "@/lib/access-model";
import { INTERNAL_CITY_OPTIONS } from "@/lib/city-options";

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
  primary_role: string | null;
  role_subtype: string | null;
  default_scope_type: string | null;
  default_scope: Record<string, string[]>;
  capability_groups: string[];
  capability_overrides?: {
    allow_permission_codes?: string[];
    deny_permission_codes?: string[];
  } | null;
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
    role_subtype: string | null;
    scope_type: string | null;
    scope_values: Record<string, string[]>;
    capability_groups: string[];
    capability_overrides?: {
      allow_permission_codes?: string[];
      deny_permission_codes?: string[];
    } | null;
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
  role_subtype: string | null;
  scope_type: string | null;
  scope_values: Record<string, string[]>;
  capability_groups: string[];
  role: Role | null;
};

type DirectoryUser = {
  user_id: string;
  full_name: string | null;
  primary_role: string | null;
  city: string | null;
  state: string | null;
};

type CapabilityOverrides = {
  allow_permission_codes: string[];
  deny_permission_codes: string[];
};

type ScopeValues = Record<string, string[]>;

type AccessBuilderState = {
  id: string;
  name: string;
  code: string;
  description: string;
  primaryRole: string;
  roleSubtype: string;
  defaultScopeType: string;
  defaultScope: ScopeValues;
  capabilityGroups: string[];
  capabilityOverrides: CapabilityOverrides;
  isActive: boolean;
};

type AccessFlowState = {
  mode: "invite" | "assign";
  fullName: string;
  email: string;
  existingUserId: string;
  primaryRole: string;
  roleSubtype: string;
  selectedRoleId: string;
  profileName: string;
  scopeType: string;
  scopeValues: ScopeValues;
  capabilityGroups: string[];
  capabilityOverrides: CapabilityOverrides;
  sendInvite: boolean;
  status: "active" | "inactive";
};

const emptyOverrides: CapabilityOverrides = {
  allow_permission_codes: [],
  deny_permission_codes: [],
};

const emptyBuilder = (): AccessBuilderState => ({
  id: "",
  name: "",
  code: "",
  description: "",
  primaryRole: "admin",
  roleSubtype: "global_admin",
  defaultScopeType: "global",
  defaultScope: {},
  capabilityGroups: [],
  capabilityOverrides: emptyOverrides,
  isActive: true,
});

const emptyFlow = (): AccessFlowState => ({
  mode: "invite",
  fullName: "",
  email: "",
  existingUserId: "",
  primaryRole: "admin",
  roleSubtype: "global_admin",
  selectedRoleId: "",
  profileName: "",
  scopeType: "global",
  scopeValues: {},
  capabilityGroups: [],
  capabilityOverrides: emptyOverrides,
  sendInvite: true,
  status: "active",
});

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
      return permission?.code || null;
    })
    .filter(Boolean) as string[];
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function normalizeOverrides(
  value?: { allow_permission_codes?: string[]; deny_permission_codes?: string[] } | null,
): CapabilityOverrides {
  return {
    allow_permission_codes: dedupeStrings(value?.allow_permission_codes || []),
    deny_permission_codes: dedupeStrings(value?.deny_permission_codes || []),
  };
}

function parseScopeInput(value: string) {
  return dedupeStrings(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function scopeFieldLabels(scopeType: string) {
  switch (scopeType) {
    case "region":
      return ["Regions"];
    case "city":
      return ["Cities"];
    case "office":
      return ["Offices", "Cities"];
    case "event":
      return ["Events"];
    case "team":
      return ["Teams"];
    case "venue":
      return ["Venues"];
    case "self":
      return ["Relationship label"];
    default:
      return [];
  }
}

function buildScopeValuesFromLabels(labels: string[], current: ScopeValues) {
  const next: ScopeValues = {};
  for (const label of labels) {
    const key = label.toLowerCase().replace(/\s+/g, "_");
    next[key] = current[key] || [];
  }
  return next;
}

function buildGeneratedRoleName(flow: AccessFlowState) {
  const primary = getPrimaryRoleOption(flow.primaryRole)?.label || "Access";
  const subtype = getRoleSubtypeOptions(flow.primaryRole).find((option) => option.value === flow.roleSubtype)?.label;
  const scope = flow.scopeType === "global" ? "Global" : summarizeScope(flow.scopeType, flow.scopeValues);
  return [primary, subtype, scope].filter(Boolean).join(" • ");
}

function compactScopeSummary(scopeType: string | null | undefined, scopeValues: ScopeValues) {
  const summary = summarizeScope(scopeType || "global", scopeValues);
  return summary.length > 80 ? `${summary.slice(0, 77)}...` : summary;
}

function compactCapabilitySummary(capabilityGroups: string[]) {
  const summary = summarizeCapabilityGroups(capabilityGroups);
  return summary.length > 80 ? `${summary.slice(0, 77)}...` : summary;
}

export default function AdminTeamPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [builder, setBuilder] = useState<AccessBuilderState>(emptyBuilder);
  const [flow, setFlow] = useState<AccessFlowState>(emptyFlow);
  const [savingRole, setSavingRole] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);

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
      setMessage((rolesJson as { error?: string }).error || "Could not load access roles.");
    } else {
      const loadedRoles = ((rolesJson as { roles?: Role[] }).roles || []).map((role) => {
        const permissionCodes = normalizeRolePermissions(role);
        return {
          ...role,
          primary_role: role.primary_role || inferPrimaryRole(role),
          capability_groups:
            role.capability_groups?.length
              ? normalizeCapabilityGroups(role.capability_groups)
              : inferCapabilityGroupsFromPermissionCodes(permissionCodes),
          default_scope: role.default_scope || {},
          capability_overrides: normalizeOverrides(role.capability_overrides || emptyOverrides),
        };
      });
      setRoles(loadedRoles);
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

  const directoryOptions = useMemo(
    () =>
      directory.map((user) => ({
        value: user.user_id,
        label: user.full_name || [user.primary_role, user.city].filter(Boolean).join(" • ") || user.user_id,
      })),
    [directory],
  );

  const activeRoles = useMemo(() => roles.filter((role) => role.is_active), [roles]);

  const filteredRoleTemplates = useMemo(
    () =>
      activeRoles.filter((role) => {
        const matchesPrimary = (role.primary_role || inferPrimaryRole(role)) === flow.primaryRole;
        const matchesSubtype = !flow.roleSubtype || role.role_subtype === flow.roleSubtype;
        return matchesPrimary && matchesSubtype;
      }),
    [activeRoles, flow.primaryRole, flow.roleSubtype],
  );

  const selectedRoleTemplate = useMemo(
    () => roles.find((role) => role.id === flow.selectedRoleId) || null,
    [roles, flow.selectedRoleId],
  );

  const availableScopeOptions = useMemo(() => getScopeOptions(flow.primaryRole), [flow.primaryRole]);
  const availableSubtypeOptions = useMemo(() => getRoleSubtypeOptions(flow.primaryRole), [flow.primaryRole]);

  const capabilityPermissionPreview = useMemo(() => {
    const direct = buildPermissionCodesFromCapabilityGroups(flow.capabilityGroups);
    const allowed = dedupeStrings([...direct, ...flow.capabilityOverrides.allow_permission_codes]);
    return allowed.filter((code) => !flow.capabilityOverrides.deny_permission_codes.includes(code));
  }, [flow.capabilityGroups, flow.capabilityOverrides]);

  const roleBuilderPermissionPreview = useMemo(() => {
    const direct = buildPermissionCodesFromCapabilityGroups(builder.capabilityGroups);
    const allowed = dedupeStrings([...direct, ...builder.capabilityOverrides.allow_permission_codes]);
    return allowed.filter((code) => !builder.capabilityOverrides.deny_permission_codes.includes(code));
  }, [builder.capabilityGroups, builder.capabilityOverrides]);

  function syncFlowFromTemplate(roleId: string) {
    const template = roles.find((role) => role.id === roleId);
    if (!template) return;

    setFlow((current) => ({
      ...current,
      selectedRoleId: roleId,
      primaryRole: template.primary_role || inferPrimaryRole(template),
      roleSubtype: template.role_subtype || current.roleSubtype,
      scopeType: template.default_scope_type || current.scopeType,
      scopeValues: template.default_scope || {},
      capabilityGroups: template.capability_groups || [],
      capabilityOverrides: normalizeOverrides(template.capability_overrides || emptyOverrides),
      profileName: template.name,
    }));
  }

  function beginRoleEdit(role: Role) {
    setBuilder({
      id: role.id,
      name: role.name,
      code: role.code || "",
      description: role.description || "",
      primaryRole: role.primary_role || inferPrimaryRole(role),
      roleSubtype: role.role_subtype || getRoleSubtypeOptions(role.primary_role || inferPrimaryRole(role))[0]?.value || "",
      defaultScopeType: role.default_scope_type || getScopeOptions(role.primary_role || inferPrimaryRole(role))[0]?.value || "global",
      defaultScope: role.default_scope || {},
      capabilityGroups: role.capability_groups || inferCapabilityGroupsFromPermissionCodes(normalizeRolePermissions(role)),
      capabilityOverrides: normalizeOverrides(role.capability_overrides || emptyOverrides),
      isActive: role.is_active,
    });
  }

  function resetBuilder() {
    setBuilder(emptyBuilder());
  }

  function toggleBuilderCapability(groupKey: string) {
    setBuilder((current) => ({
      ...current,
      capabilityGroups: current.capabilityGroups.includes(groupKey)
        ? current.capabilityGroups.filter((key) => key !== groupKey)
        : [...current.capabilityGroups, groupKey],
    }));
  }

  function toggleFlowCapability(groupKey: string) {
    setFlow((current) => ({
      ...current,
      capabilityGroups: current.capabilityGroups.includes(groupKey)
        ? current.capabilityGroups.filter((key) => key !== groupKey)
        : [...current.capabilityGroups, groupKey],
    }));
  }

  async function saveRole(event: React.FormEvent) {
    event.preventDefault();
    setSavingRole(true);
    setMessage("");

    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: builder.id,
        name: builder.name,
        code: builder.code,
        description: builder.description,
        primaryRole: builder.primaryRole,
        roleSubtype: builder.roleSubtype,
        defaultScopeType: builder.defaultScopeType,
        defaultScope: builder.defaultScope,
        capabilityGroups: builder.capabilityGroups,
        capabilityOverrides: builder.capabilityOverrides,
        isActive: builder.isActive,
      }),
    });

    const json = (await response.json()) as { error?: string };
    setSavingRole(false);

    if (!response.ok) {
      setMessage(json.error || "Could not save access profile.");
      return;
    }

    setMessage(builder.id ? "Access profile updated." : "Access profile created.");
    resetBuilder();
    await loadData();
  }

  async function resolveRoleIdForFlow() {
    if (flow.selectedRoleId) {
      return { roleId: flow.selectedRoleId, profileCreated: false };
    }

    const generatedName = flow.profileName.trim() || buildGeneratedRoleName(flow);
    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: generatedName,
        description: `${getPrimaryRoleOption(flow.primaryRole)?.label || "Access"} profile for ${summarizeScope(flow.scopeType, flow.scopeValues)}.`,
        primaryRole: flow.primaryRole,
        roleSubtype: flow.roleSubtype,
        defaultScopeType: flow.scopeType,
        defaultScope: flow.scopeValues,
        capabilityGroups: flow.capabilityGroups,
        capabilityOverrides: flow.capabilityOverrides,
        isActive: flow.status === "active",
      }),
    });

    const json = (await response.json()) as { error?: string; roleId?: string };
    if (!response.ok || !json.roleId) {
      throw new Error(json.error || "Could not create access profile.");
    }
    return { roleId: json.roleId, profileCreated: true };
  }

  async function submitFlow(event: React.FormEvent) {
    event.preventDefault();
    setSavingFlow(true);
    setMessage("");

    try {
      const { roleId, profileCreated } = await resolveRoleIdForFlow();

      if (flow.mode === "invite") {
        const inviteResponse = await fetch("/api/admin/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: flow.email,
            full_name: flow.fullName,
            role_id: roleId,
            role_subtype: flow.roleSubtype,
            scope_type: flow.scopeType,
            scope_values: flow.scopeValues,
            capability_groups: flow.capabilityGroups,
            capability_overrides: flow.capabilityOverrides,
          }),
        });

        const inviteJson = (await inviteResponse.json()) as {
          error?: string;
          resentExisting?: boolean;
          inviteId?: string;
          email?: {
            attempted?: boolean;
            sent?: boolean;
            sender?: string;
            usedFallbackSender?: boolean;
            providerId?: string | null;
            error?: string | null;
            reason?: string | null;
          };
        };
        if (!inviteResponse.ok) {
          throw new Error(inviteJson.error || "Could not send invite.");
        }

        const statusLines = [
          profileCreated ? "Access profile created." : "Using existing access profile.",
          inviteJson.resentExisting ? "Existing pending invite refreshed." : `Invite record created${inviteJson.inviteId ? ` (${inviteJson.inviteId})` : ""}.`,
        ];

        if (inviteJson.email?.sent) {
          statusLines.push(
            inviteJson.email.usedFallbackSender
              ? `Invite email sent with fallback sender ${inviteJson.email.sender}.`
              : `Invite email sent from ${inviteJson.email.sender}.`,
          );
          if (inviteJson.email.providerId) {
            statusLines.push(`Delivery attempt recorded as ${inviteJson.email.providerId}.`);
          }
        } else if (inviteJson.email?.attempted) {
          statusLines.push(`Invite email failed: ${inviteJson.email.error || "Unknown sender error."}`);
        } else if (inviteJson.email?.reason === "missing_api_key") {
          statusLines.push("Invite record created, but email was not sent because RESEND_API_KEY is not configured.");
        } else {
          statusLines.push("Invite record created, but email sender is not fully configured.");
        }

        setMessage(statusLines.join(" "));
      } else {
        const assignResponse = await fetch("/api/admin/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "assignRole",
            userId: flow.existingUserId,
            roleId,
            roleSubtype: flow.roleSubtype,
            scopeType: flow.scopeType,
            scopeValues: flow.scopeValues,
            capabilityGroups: flow.capabilityGroups,
            capabilityOverrides: flow.capabilityOverrides,
          }),
        });
        const assignJson = (await assignResponse.json()) as { error?: string };
        if (!assignResponse.ok) {
          throw new Error(assignJson.error || "Could not assign access.");
        }
        setMessage(`${profileCreated ? "Access profile created. " : ""}Access assigned.`);
      }

      setFlow(emptyFlow());
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not complete access setup.");
    } finally {
      setSavingFlow(false);
    }
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
        <div className="mx-auto max-w-7xl text-white/60">Loading Team & Access...</div>
      </main>
    );
  }

  const scopeLabels = scopeFieldLabels(flow.scopeType);
  const scopePreview = summarizeScope(flow.scopeType, flow.scopeValues);
  const capabilityPreview = summarizeCapabilityGroups(flow.capabilityGroups);
  const pendingInvites = invites.filter((invite) => getInviteState(invite) === "pending");

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Team & access</div>
            <h1 className="ev-title">Onboard staff with clear scope, capability groups, and invite review before access goes live.</h1>
            <p className="ev-subtitle">
              Build or reuse access profiles, review the final role package, then invite or assign without exposing raw permission language.
            </p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="ev-panel p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Active profiles</div>
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
        <div className="ev-panel p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Capability groups</div>
          <div className="mt-2 text-3xl font-black text-white">{CAPABILITY_GROUPS.length}</div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Access onboarding</div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">Role → scope → capability workflow</h2>
            <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
              {(["invite", "assign"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    flow.mode === mode ? "bg-white text-black" : "text-white/65 hover:text-white"
                  }`}
                  onClick={() => setFlow((current) => ({ ...current, mode, sendInvite: mode === "invite" }))}
                >
                  {mode === "invite" ? "Invite by email" : "Assign existing user"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submitFlow} className="mt-6 grid gap-6">
            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 1</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Identity</h3>
              <p className="mt-1 text-sm text-white/58">
                Start with the person. Choose invite onboarding or attach access to an existing platform user.
              </p>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/45">Required</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {flow.mode === "invite" ? (
                  <>
                    <input
                      className="ev-field"
                      placeholder="Full name"
                      value={flow.fullName}
                      onChange={(event) => setFlow((current) => ({ ...current, fullName: event.target.value }))}
                    />
                    <input
                      className="ev-field"
                      type="email"
                      placeholder="Email"
                      value={flow.email}
                      onChange={(event) => setFlow((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </>
                ) : (
                  <select
                    className="ev-field md:col-span-2"
                    value={flow.existingUserId}
                    onChange={(event) => setFlow((current) => ({ ...current, existingUserId: event.target.value }))}
                    required
                  >
                    <option value="">Select a platform user</option>
                    {directoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 2</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Primary role</h3>
              <p className="mt-1 text-sm text-white/58">Choose the access type first. The scope options update automatically for the selected role.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {PRIMARY_ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() =>
                      setFlow((current) => ({
                        ...current,
                        primaryRole: role.value,
                        roleSubtype: ROLE_SUBTYPE_OPTIONS[role.value]?.[0]?.value || "",
                        scopeType: ROLE_SCOPE_OPTIONS[role.value]?.[0]?.value || "global",
                        scopeValues: {},
                        selectedRoleId: "",
                        capabilityGroups: [],
                        capabilityOverrides: emptyOverrides,
                      }))
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      flow.primaryRole === role.value
                        ? "border-[#A259FF]/55 bg-[#A259FF]/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{role.label}</div>
                    <div className="mt-1 text-sm text-white/56">{role.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select
                  className="ev-field"
                  value={flow.roleSubtype}
                  onChange={(event) => setFlow((current) => ({ ...current, roleSubtype: event.target.value, selectedRoleId: "" }))}
                >
                  {availableSubtypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="ev-field"
                  value={flow.selectedRoleId}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      setFlow((current) => ({ ...current, selectedRoleId: "", profileName: "" }));
                      return;
                    }
                    syncFlowFromTemplate(value);
                  }}
                >
                  <option value="">Build from this role selection</option>
                  {filteredRoleTemplates.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
                {availableSubtypeOptions.find((option) => option.value === flow.roleSubtype)?.description || "Choose the closest role subtype for this staff member."}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 3</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Scope</h3>
              <p className="mt-1 text-sm text-white/58">Only show the scope fields that matter for this role.</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <select
                  className="ev-field"
                  value={flow.scopeType}
                  onChange={(event) => {
                    const nextScopeType = event.target.value;
                    setFlow((current) => ({
                      ...current,
                      scopeType: nextScopeType,
                      scopeValues: buildScopeValuesFromLabels(scopeFieldLabels(nextScopeType), current.scopeValues),
                    }));
                  }}
                >
                  {availableScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {!flow.selectedRoleId ? (
                  <input
                    className="ev-field"
                    placeholder="Access profile name"
                    value={flow.profileName}
                    onChange={(event) => setFlow((current) => ({ ...current, profileName: event.target.value }))}
                  />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/62">
                    Using profile: <span className="font-semibold text-white">{selectedRoleTemplate?.name}</span>
                  </div>
                )}
              </div>

              {scopeLabels.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {scopeLabels.map((label) => {
                    const key = label.toLowerCase().replace(/\s+/g, "_");
                    return (
                      <div key={key}>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                        <input
                          className="ev-field"
                          placeholder={`Add ${label.toLowerCase()} separated by commas`}
                          value={(flow.scopeValues[key] || []).join(", ")}
                          list={label === "Cities" ? "team-access-cities" : undefined}
                          onChange={(event) =>
                            setFlow((current) => ({
                              ...current,
                              scopeValues: {
                                ...current.scopeValues,
                                [key]: parseScopeInput(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <datalist id="team-access-cities">
                {INTERNAL_CITY_OPTIONS.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 4</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Capabilities</h3>
              <p className="mt-1 text-sm text-white/58">Use grouped capabilities instead of raw technical fields.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {CAPABILITY_GROUPS.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => toggleFlowCapability(group.key)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      flow.capabilityGroups.includes(group.key)
                        ? "border-[#A259FF]/55 bg-[#A259FF]/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{group.label}</div>
                    <div className="mt-1 text-sm text-white/56">{group.description}</div>
                  </button>
                ))}
              </div>

              <details className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">Advanced overrides</summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Allow extra permissions</div>
                    <input
                      className="ev-field"
                      placeholder="permission.code, permission.code"
                      value={flow.capabilityOverrides.allow_permission_codes.join(", ")}
                      onChange={(event) =>
                        setFlow((current) => ({
                          ...current,
                          capabilityOverrides: {
                            ...current.capabilityOverrides,
                            allow_permission_codes: parseScopeInput(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Deny permissions</div>
                    <input
                      className="ev-field"
                      placeholder="permission.code, permission.code"
                      value={flow.capabilityOverrides.deny_permission_codes.join(", ")}
                      onChange={(event) =>
                        setFlow((current) => ({
                          ...current,
                          capabilityOverrides: {
                            ...current.capabilityOverrides,
                            deny_permission_codes: parseScopeInput(event.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </details>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 5</div>
              <h3 className="mt-2 text-lg font-semibold text-white">Review + {flow.mode === "invite" ? "invite" : "assign"}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Role</div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {getPrimaryRoleOption(flow.primaryRole)?.label || "Role"}
                  </div>
                  <div className="mt-1 text-sm text-white/58">
                    {availableSubtypeOptions.find((option) => option.value === flow.roleSubtype)?.label || "Subtype"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Scope</div>
                  <div className="mt-2 text-sm font-semibold text-white">{scopePreview}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Capabilities</div>
                  <div className="mt-2 text-sm font-semibold text-white">{capabilityPreview}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/58">
                This person will get <span className="font-semibold text-white">{capabilityPermissionPreview.length}</span> permission codes behind the scenes through grouped capabilities and any advanced overrides.
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Final review</div>
                <div className="mt-3 grid gap-3 text-sm text-white/66 md:grid-cols-2">
                  <div>{flow.mode === "invite" ? `Invite email: ${flow.email || "Not set"}` : `Existing user: ${flow.existingUserId || "Not selected"}`}</div>
                  <div>{flow.mode === "invite" ? `Invite name: ${flow.fullName || "Not set"}` : `Profile name: ${flow.profileName || selectedRoleTemplate?.name || "Using selected role"}`}</div>
                  <div>Scope package: {scopePreview}</div>
                  <div>Capability package: {capabilityPreview}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="submit" className="ev-button-primary" disabled={savingFlow}>
                  {savingFlow ? (flow.mode === "invite" ? "Sending invite..." : "Assigning access...") : flow.mode === "invite" ? "Send invite" : "Assign access"}
                </button>
              </div>
            </section>
          </form>
        </section>

        <section className="grid gap-6">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Access profiles</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white">{builder.id ? "Edit profile" : "Create profile"}</h2>
              {builder.id ? (
                <button type="button" onClick={resetBuilder} className="ev-button-secondary">
                  New profile
                </button>
              ) : null}
            </div>

            <form onSubmit={saveRole} className="mt-5 grid gap-4">
              <input
                className="ev-field"
                placeholder="Profile name"
                value={builder.name}
                onChange={(event) => setBuilder((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <input
                className="ev-field"
                placeholder="Profile code"
                value={builder.code}
                onChange={(event) => setBuilder((current) => ({ ...current, code: event.target.value }))}
              />
              <textarea
                className="ev-textarea"
                rows={3}
                placeholder="Plain-English summary of what this profile should do"
                value={builder.description}
                onChange={(event) => setBuilder((current) => ({ ...current, description: event.target.value }))}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className="ev-field"
                  value={builder.primaryRole}
                  onChange={(event) =>
                    setBuilder((current) => ({
                      ...current,
                      primaryRole: event.target.value,
                      roleSubtype: ROLE_SUBTYPE_OPTIONS[event.target.value]?.[0]?.value || "",
                      defaultScopeType: ROLE_SCOPE_OPTIONS[event.target.value]?.[0]?.value || "global",
                      defaultScope: {},
                    }))
                  }
                >
                  {PRIMARY_ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <select
                  className="ev-field"
                  value={builder.roleSubtype}
                  onChange={(event) => setBuilder((current) => ({ ...current, roleSubtype: event.target.value }))}
                >
                  {getRoleSubtypeOptions(builder.primaryRole).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="ev-field"
                value={builder.defaultScopeType}
                onChange={(event) =>
                  setBuilder((current) => ({
                    ...current,
                    defaultScopeType: event.target.value,
                    defaultScope: buildScopeValuesFromLabels(scopeFieldLabels(event.target.value), current.defaultScope),
                  }))
                }
              >
                {getScopeOptions(builder.primaryRole).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {scopeFieldLabels(builder.defaultScopeType).length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {scopeFieldLabels(builder.defaultScopeType).map((label) => {
                    const key = label.toLowerCase().replace(/\s+/g, "_");
                    return (
                      <div key={key}>
                        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                        <input
                          className="ev-field"
                          placeholder={`Default ${label.toLowerCase()} separated by commas`}
                          value={(builder.defaultScope[key] || []).join(", ")}
                          list={label === "Cities" ? "team-access-cities" : undefined}
                          onChange={(event) =>
                            setBuilder((current) => ({
                              ...current,
                              defaultScope: {
                                ...current.defaultScope,
                                [key]: parseScopeInput(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="grid gap-3">
                {CAPABILITY_GROUPS.map((group) => (
                  <label key={group.key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                    <input
                      type="checkbox"
                      checked={builder.capabilityGroups.includes(group.key)}
                      onChange={() => toggleBuilderCapability(group.key)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-white">{group.label}</span>
                      <span className="block text-sm text-white/56">{group.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <details className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">Advanced permission overrides</summary>
                <div className="mt-4 grid gap-4">
                  <input
                    className="ev-field"
                    placeholder="Allow extra permission codes"
                    value={builder.capabilityOverrides.allow_permission_codes.join(", ")}
                    onChange={(event) =>
                      setBuilder((current) => ({
                        ...current,
                        capabilityOverrides: {
                          ...current.capabilityOverrides,
                          allow_permission_codes: parseScopeInput(event.target.value),
                        },
                      }))
                    }
                  />
                  <input
                    className="ev-field"
                    placeholder="Deny permission codes"
                    value={builder.capabilityOverrides.deny_permission_codes.join(", ")}
                    onChange={(event) =>
                      setBuilder((current) => ({
                        ...current,
                        capabilityOverrides: {
                          ...current.capabilityOverrides,
                          deny_permission_codes: parseScopeInput(event.target.value),
                        },
                      }))
                    }
                  />
                </div>
              </details>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/58">
                This profile currently resolves to <span className="font-semibold text-white">{roleBuilderPermissionPreview.length}</span> permission codes.
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={builder.isActive}
                  onChange={(event) => setBuilder((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Profile is active
              </label>

              <button type="submit" className="ev-button-primary" disabled={savingRole}>
                {savingRole ? "Saving..." : builder.id ? "Save profile" : "Create profile"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => beginRoleEdit(role)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-[#A259FF]/35 hover:bg-[#A259FF]/8"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-white">{role.name}</div>
                    {!role.is_active ? <span className="rounded-full border border-red-400/30 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-red-200">Inactive</span> : null}
                  </div>
                  <div className="mt-1 text-sm text-white/56">{role.description || "No profile description yet."}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                    {(getPrimaryRoleOption(role.primary_role || inferPrimaryRole(role))?.label || "Access")} • {summarizeCapabilityGroups(role.capability_groups || [])}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Pending invites</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-sm text-white/58">Pending access that still needs acceptance or resend action.</div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                {pendingInvites.length}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {pendingInvites.length ? (
                pendingInvites.map((invite) => {
                  const inviteState = getInviteState(invite);
                  return (
                    <div key={invite.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-white">{invite.full_name || invite.email}</div>
                          <div className="text-sm text-white/58">{invite.email}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">
                            {invite.role?.name || "No role"} • {compactScopeSummary(invite.scope_type, invite.scope_values || {})}
                          </div>
                          <div className="mt-1 text-sm text-white/48">{compactCapabilitySummary(invite.capability_groups || [])}</div>
                          <div className="mt-3 text-xs text-white/45">
                            Created {formatDate(invite.created_at)} • Expires {formatDate(invite.expires_at)} • Accepted {formatDate(invite.accepted_at)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/52">{inviteState}</span>
                          {inviteState === "pending" ? (
                            <>
                              <button type="button" className="ev-button-secondary" onClick={() => updateInvite(invite.id, "resend")}>
                                Resend
                              </button>
                              <button type="button" className="rounded-2xl border border-red-400/25 px-4 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-400/10" onClick={() => updateInvite(invite.id, "revoke")}>
                                Revoke
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">
                  No invites yet. Start with the guided onboarding flow and send the first access invite from here.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="ev-panel mt-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="ev-section-kicker">Active access</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Current internal access</h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
            {team.length} users
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {team.length ? (
            team.map((member) => (
              <div key={member.user_id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-white">{member.profile?.full_name || member.user_id}</div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${member.is_active ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" : "border-red-400/25 bg-red-500/10 text-red-100"}`}>
                        {member.is_active ? "active" : "inactive"}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                        {member.roles.length} assignment{member.roles.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-white/55">
                      {member.profile?.primary_role || "member"}{member.profile?.city ? ` • ${member.profile.city}` : ""}
                    </div>
                  </div>
                  <div className="grid gap-3 xl:min-w-[480px]">
                    {member.roles.map((assignment) => (
                      <div key={assignment.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{assignment.role?.name || "Unknown role"}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#caa7ff]">
                                {assignment.role_subtype || assignment.role?.role_subtype || "standard"}
                              </span>
                              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                                {assignment.scope_type || assignment.role?.default_scope_type || "global"}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-white/52">
                              Scope: {compactScopeSummary(assignment.scope_type || assignment.role?.default_scope_type || "global", assignment.scope_values || assignment.role?.default_scope || {})}
                            </div>
                            <div className="mt-1 text-sm text-white/48">
                              Capabilities: {compactCapabilitySummary(assignment.capability_groups?.length ? assignment.capability_groups : assignment.role?.capability_groups || [])}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
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
