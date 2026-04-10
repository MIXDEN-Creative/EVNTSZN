import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getFounderSession } from "@/lib/founder-session";
import { getLoginUrl, getRestrictedSurfaceForPath, getRestrictedUrl } from "@/lib/domains";
import { DEFAULT_ADMIN_PERMISSION_CODES } from "@/lib/access-control";
import { buildPermissionCodesFromCapabilityGroups, normalizeCapabilityGroups } from "@/lib/access-model";

type RbacRole = {
  id: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  is_system?: boolean | null;
};

type RbacMembership = {
  id: string;
  is_active: boolean;
  role_id: string;
  roles: RbacRole | RbacRole[] | null;
};

type LegacyMembership = {
  id: string;
  is_owner: boolean;
  is_active: boolean;
  role_id: string;
  admin_roles: {
    id?: string | null;
    name?: string | null;
    description?: string | null;
  } | null;
};

type RbacPermissionMembership = {
  is_active: boolean;
  capability_groups?: string[] | null;
  capability_overrides?: Record<string, unknown> | null;
  roles:
    | {
        id?: string | null;
        code?: string | null;
        name?: string | null;
        capability_groups?: string[] | null;
        capability_overrides?: Record<string, unknown> | null;
        role_permissions?:
          | {
              permissions?: {
                code?: string | null;
                label?: string | null;
              } | null;
            }[]
          | null;
      }
    | {
        id?: string | null;
        code?: string | null;
        name?: string | null;
        capability_groups?: string[] | null;
        capability_overrides?: Record<string, unknown> | null;
        role_permissions?:
          | {
              permissions?: {
                code?: string | null;
                label?: string | null;
              } | null;
            }[]
          | null;
      }[]
    | null;
};

export function isMissingRbacTableError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return code === "42P01" || code === "PGRST205" || /roles|permissions|user_roles|role_permissions/i.test(message);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user || null;
}

async function getAccessUser() {
  const user = await getCurrentUser();
  if (user) {
    return { user, isFounder: false };
  }

  const founder = await getFounderSession();
  if (founder) {
    return {
      user: {
        id: founder.id,
        email: founder.email,
      },
      isFounder: true,
    };
  }

  return { user: null, isFounder: false };
}

export async function getAdminMemberships(userId: string, options?: { isFounder?: boolean }) {
  if (options?.isFounder) {
    return [
      {
        id: "founder-membership",
        is_owner: true,
        is_active: true,
        role_id: "founder",
        roles: {
          id: "founder",
          name: "Founder",
          description: "Full-system override across EVNTSZN and EPL.",
        },
        admin_roles: {
          id: "founder",
          name: "Founder",
          description: "Full-system override across EVNTSZN and EPL.",
        },
      },
    ];
  }

  const rbacResponse = await supabaseAdmin
    .from("user_roles")
    .select(`
      id,
      is_active,
      role_id,
      roles (
        id,
        code,
        name,
        description,
        is_system
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!rbacResponse.error) {
    return ((rbacResponse.data || []) as RbacMembership[]).map((membership) => {
      const role = Array.isArray(membership.roles) ? membership.roles[0] || null : membership.roles;
      return {
      id: membership.id,
      is_owner: role?.code === "platform_admin" || role?.name === "Platform Admin",
      is_active: membership.is_active,
      role_id: membership.role_id,
      roles: role,
      admin_roles: role,
    };
    });
  }

  if (!isMissingRbacTableError(rbacResponse.error)) {
    throw new Error(rbacResponse.error.message);
  }

  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select(`
      id,
      is_owner,
      is_active,
      role_id,
      admin_roles (
        id,
        name,
        description
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as LegacyMembership[]).map((membership) => ({
    ...membership,
    roles: membership.admin_roles,
  }));
}

export async function isAdminAuthorized() {
  const { user } = await getAccessUser();
  if (!user) return false;

  const memberships = await getAdminMemberships(user.id, { isFounder: user.id.startsWith("founder:") });
  return memberships.length > 0;
}

export async function requireAdmin(nextPath = "/epl/admin") {
  const { user, isFounder } = await getAccessUser();
  if (!user) {
    redirect(getLoginUrl(nextPath));
  }

  const memberships = await getAdminMemberships(user.id, { isFounder });
  if (!memberships.length) {
    redirect(
      getRestrictedUrl(getRestrictedSurfaceForPath(nextPath), {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return { user, memberships };
}

export async function getAdminPermissions(userId: string) {
  if (userId.startsWith("founder:")) {
    return [...DEFAULT_ADMIN_PERMISSION_CODES];
  }

  const rbacResponse = await supabaseAdmin
    .from("user_roles")
    .select(`
      is_active,
      roles (
        id,
        code,
        name,
        capability_groups,
        capability_overrides,
        role_permissions (
          permissions (
            code,
            label
          )
        )
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!rbacResponse.error) {
    const codes = new Set<string>();
    for (const membership of (rbacResponse.data || []) as RbacPermissionMembership[]) {
      const role = Array.isArray(membership.roles) ? membership.roles[0] || null : membership.roles;
      if (role?.code === "platform_admin") {
        DEFAULT_ADMIN_PERMISSION_CODES.forEach((code) => codes.add(code));
      }

      for (const code of buildPermissionCodesFromCapabilityGroups(normalizeCapabilityGroups(role?.capability_groups || membership.capability_groups || []))) {
        codes.add(code);
      }

      const perms = role?.role_permissions || [];
      for (const rp of perms) {
        const code = rp?.permissions?.code;
        if (code) codes.add(code);
      }

      const roleOverrides =
        role?.capability_overrides && typeof role.capability_overrides === "object" && !Array.isArray(role.capability_overrides)
          ? role.capability_overrides
          : {};
      const membershipOverrides =
        membership.capability_overrides && typeof membership.capability_overrides === "object" && !Array.isArray(membership.capability_overrides)
          ? membership.capability_overrides
          : {};

      const allowCodes = [
        ...(((roleOverrides as { allow_permission_codes?: unknown[] }).allow_permission_codes || []) as unknown[]),
        ...(((membershipOverrides as { allow_permission_codes?: unknown[] }).allow_permission_codes || []) as unknown[]),
      ];
      const denyCodes = [
        ...(((roleOverrides as { deny_permission_codes?: unknown[] }).deny_permission_codes || []) as unknown[]),
        ...(((membershipOverrides as { deny_permission_codes?: unknown[] }).deny_permission_codes || []) as unknown[]),
      ];

      for (const value of allowCodes) {
        const code = String(value || "").trim();
        if (code) codes.add(code);
      }
      for (const value of denyCodes) {
        const code = String(value || "").trim();
        if (code) codes.delete(code);
      }
    }

    return Array.from(codes);
  }

  if (!isMissingRbacTableError(rbacResponse.error)) {
    throw new Error(rbacResponse.error.message);
  }

  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select(`
      is_owner,
      admin_roles (
        admin_role_permissions (
          admin_permissions (
            code,
            label
          )
        )
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const codes = new Set<string>();
  type PermissionMembership = {
    is_owner: boolean;
    admin_roles:
      | {
          admin_role_permissions?: {
            admin_permissions?: {
              code?: string | null;
            } | null;
          }[];
        }
      | null;
  };

  for (const membership of (data || []) as PermissionMembership[]) {
    if (membership.is_owner) {
      codes.add("admin.manage");
      codes.add("orders.view");
      codes.add("orders.manage");
      codes.add("rewards.view");
      codes.add("rewards.manage");
      codes.add("catalog.manage");
      codes.add("customers.view");
    }

    const perms = membership.admin_roles?.admin_role_permissions || [];
    for (const rp of perms) {
      const code = rp?.admin_permissions?.code;
      if (code) codes.add(code);
    }
  }

  return Array.from(codes);
}

export async function hasAdminPermission(permissionCode: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  const permissions = await getAdminPermissions(user.id);
  return permissions.includes(permissionCode);
}

export async function requireAdminPermission(permissionCode: string, nextPath = "/epl/admin") {
  const { user, memberships } = await requireAdmin(nextPath);
  const permissions = await getAdminPermissions(user.id);

  if (!permissions.includes(permissionCode)) {
    redirect(
      getRestrictedUrl(getRestrictedSurfaceForPath(nextPath), {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return { user, memberships, permissions };
}

export async function requireHq(nextPath = "/epl/admin/operations") {
  const { user, memberships } = await requireAdmin(nextPath);
  const permissions = await getAdminPermissions(user.id);
  const hasHqAccess =
    user.id.startsWith("founder:") ||
    permissions.includes("hq.manage") ||
    memberships.some((membership: { is_owner?: boolean | null }) => membership.is_owner);

  if (!hasHqAccess) {
    redirect(
      getRestrictedUrl("hq", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return { user, memberships, permissions };
}
