import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getFounderSession } from "@/lib/founder-session";
import { getLoginUrl, getRestrictedSurfaceForPath, getRestrictedUrl } from "@/lib/domains";

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
        admin_roles: {
          id: "founder",
          name: "Founder",
          description: "Full-system override across EVNTSZN and EPL.",
        },
      },
    ];
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

  return data || [];
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
    return [
      "admin.manage",
      "orders.view",
      "orders.manage",
      "rewards.view",
      "rewards.manage",
      "catalog.manage",
      "customers.view",
      "analytics.view",
      "approvals.manage",
      "sponsors.manage",
      "store.manage",
      "content.manage",
      "scanner.manage",
    ];
  }

  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select(`
      is_owner,
      admin_roles (
        id,
        name,
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
  const hasHqAccess = memberships.some((membership: { is_owner?: boolean | null }) => membership.is_owner);

  if (!hasHqAccess) {
    redirect(
      getRestrictedUrl("hq", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return { user, memberships };
}
