import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLoginUrl } from "@/lib/domains";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user || null;
}

export async function getAdminMemberships(userId: string) {
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
  const user = await getCurrentUser();
  if (!user) return false;

  const memberships = await getAdminMemberships(user.id);
  return memberships.length > 0;
}

export async function requireAdmin(nextPath = "/epl/admin") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(getLoginUrl(nextPath));
  }

  const memberships = await getAdminMemberships(user.id);
  if (!memberships.length) {
    redirect("/account");
  }

  return { user, memberships };
}

export async function getAdminPermissions(userId: string) {
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
    redirect("/epl/admin");
  }

  return { user, memberships, permissions };
}
