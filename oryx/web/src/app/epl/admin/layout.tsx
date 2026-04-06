import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin, getAdminPermissions } from "@/lib/admin-auth";
import { getAdminOrigin, getEplOrigin } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, memberships } = await requireAdmin("/epl/admin");
  const host = (await headers()).get("host") || undefined;
  const permissions = await getAdminPermissions(user.id);

  const canManageAdmins = permissions.includes("admin.manage");
  const canViewOrders = permissions.includes("orders.view");
  const canViewRewards = permissions.includes("rewards.view");
  const canManageCatalog = permissions.includes("catalog.manage");

  const roleNames = memberships
    .map((m: any) => m.admin_roles?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/10 bg-[#090909] p-6">
          <div className="rounded-full border border-[#A259FF]/40 bg-[#A259FF]/10 px-4 py-2 text-sm text-[#d8c2ff] inline-flex">
            EVNTSZN Admin
          </div>

          <div className="mt-5">
            <div className="text-2xl font-black">Command Center</div>
            <div className="mt-2 text-sm text-white/60">{user.email}</div>
            <div className="mt-1 text-sm text-[#A259FF]">{roleNames || "Admin"}</div>
          </div>

          <nav className="mt-8 grid gap-3">
            <Link href={getAdminOrigin(host)} className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10">
              Overview
            </Link>

            {canViewOrders ? (
              <Link href={`${getAdminOrigin(host)}/merch-orders`} className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10">
                Merch Orders
              </Link>
            ) : null}

            {canViewRewards ? (
              <Link href={`${getAdminOrigin(host)}/rewards`} className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10">
                Rewards
              </Link>
            ) : null}

            {canManageCatalog ? (
              <Link href={`${getEplOrigin(host)}/store`} className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10">
                Storefront
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/team`} className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/10">
                Team & Access
              </Link>
            ) : null}
          </nav>

          <form action="/account/logout" method="POST" className="mt-8">
            <button className="w-full rounded-xl border border-red-500/25 px-4 py-3 text-red-300 hover:bg-red-500/10">
              Sign Out
            </button>
          </form>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}
