import { getAdminPermissions, getCurrentUser } from "@/lib/admin-auth";

export async function requireApiAdminPermission(
  requiredPermission: string,
  fallbackPermissions: string[] = []
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      body: { error: "Authentication required." },
    };
  }

  const permissions = await getAdminPermissions(user.id);
  const allowed = [requiredPermission, ...fallbackPermissions].some((permission) =>
    permissions.includes(permission)
  );

  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      body: { error: "Forbidden." },
    };
  }

  return {
    ok: true as const,
    user,
    permissions,
  };
}
