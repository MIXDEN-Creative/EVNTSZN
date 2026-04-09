import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getAdminPermissions, requireAdmin, requireHq } from "@/lib/admin-auth";
import { getAdminOrigin, getEplOrigin, getHqOrigin, getSurfaceFromHost } from "@/lib/domains";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || undefined;
  const surface = getSurfaceFromHost(host || "") || "admin";
  const isHqSurface = surface === "hq";
  const origin = isHqSurface ? getHqOrigin(host) : getAdminOrigin(host);
  const title = isHqSurface ? "HQ Workspace | EVNTSZN" : "Admin Workspace | EVNTSZN";
  const description = isHqSurface
    ? "Global EVNTSZN HQ workspace for company-wide operations, overrides, approvals, and system control."
    : "EVNTSZN admin workspace for team access, discovery, events, support, and operating workflows.";

  return {
    title,
    description,
    alternates: {
      canonical: origin,
    },
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "EVNTSZN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host") || undefined;
  const surface = getSurfaceFromHost(host || "") || "admin";
  const isHqSurface = surface === "hq";
  const access = isHqSurface ? await requireHq("/epl/admin/operations") : await requireAdmin("/epl/admin");
  const { user, memberships } = access;
  const permissions = await getAdminPermissions(user.id);

  const canManageAdmins = permissions.includes("admin.manage");
  const canViewOrders = permissions.includes("orders.view");
  const canViewRewards = permissions.includes("rewards.view");
  const canManageCatalog = permissions.includes("catalog.manage");
  const canManageEvents = permissions.includes("events.manage");
  const canManageOpportunities = permissions.includes("opportunities.manage");
  const canManageScanner = permissions.includes("scanner.manage");
  const canManageCity = permissions.includes("city.manage");
  const canManageSupport = permissions.includes("support.manage") || permissions.includes("support.respond");
  const canManagePrograms = permissions.includes("admin.manage") || permissions.includes("city.manage");

  const roleNames = memberships
    .map((m: any) => m.admin_roles?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className={`ev-surface ${isHqSurface ? "ev-surface--hq" : "ev-surface--admin"} text-white`}>
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(9,9,12,0.96),rgba(5,5,8,0.96))] p-6">
          <div className="ev-kicker">{isHqSurface ? "EVNTSZN HQ" : "EVNTSZN Admin"}</div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="https://evntszn.com" className="text-lg font-black tracking-tight text-white">
              EVNTSZN
            </Link>
            <Link href="https://app.evntszn.com/account" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.08]">
              App hub
            </Link>
          </div>

          <div className="mt-5">
            <div className="text-2xl font-black">{isHqSurface ? "HQ workspace" : "Admin workspace"}</div>
            <div className="mt-2 text-sm text-white/60">{user.email}</div>
            <div className="mt-1 text-sm text-[#A259FF]">{roleNames || "Admin"}</div>
          </div>

          <nav className="mt-8 grid gap-3">
            <Link href={isHqSurface ? getHqOrigin(host) : getAdminOrigin(host)} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
              {isHqSurface ? "HQ Overview" : "Overview"}
            </Link>

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/control-center`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Operations summary
              </Link>
            ) : null}

            {canViewOrders ? (
              <Link href={`${getAdminOrigin(host)}/merch-orders`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Merch Orders
              </Link>
            ) : null}

            {canViewRewards ? (
              <Link href={`${getAdminOrigin(host)}/rewards`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Rewards
              </Link>
            ) : null}

            {canManageCatalog ? (
              <Link href={`${getEplOrigin(host)}/store`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Storefront
              </Link>
            ) : null}

            {canManageCatalog ? (
              <Link href={`${getAdminOrigin(host)}/discovery`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Discovery visibility
              </Link>
            ) : null}

            {isHqSurface ? (
              <Link href={`${getHqOrigin(host)}/draft`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Draft Console
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/team`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Team & Access
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/users`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Users
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/approvals`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Approvals
              </Link>
            ) : null}

            {canManageCity ? (
              <Link href={`${getAdminOrigin(host)}/city-office`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                City Office
              </Link>
            ) : null}

            {canManagePrograms ? (
              <Link href={`${getAdminOrigin(host)}/programs`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Programs
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/hiring`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Hiring
              </Link>
            ) : null}

            {canManageOpportunities ? (
              <Link href={`${getAdminOrigin(host)}/opportunities`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Opportunities
              </Link>
            ) : null}

            {canManageEvents ? (
              <Link href={`${getAdminOrigin(host)}/events`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Events
              </Link>
            ) : null}

            {canManageCatalog ? (
              <Link href={`${getAdminOrigin(host)}/sponsors`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Sponsors & Packages
              </Link>
            ) : null}

            {canManageScanner ? (
              <Link href={`${getAdminOrigin(host)}/scanner`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Scanner
              </Link>
            ) : null}

            {canManageSupport ? (
              <Link href={`${getAdminOrigin(host)}/support`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                Support Desk
              </Link>
            ) : null}

            {canManageAdmins ? (
              <Link href={`${getAdminOrigin(host)}/issues`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                System Issues
              </Link>
            ) : null}
          </nav>

          <form action="/account/logout" method="POST" className="mt-8">
            <button className="w-full rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-red-300 hover:bg-red-500/10">
              Sign Out
            </button>
          </form>
        </aside>

        <section className="px-4 py-4 md:px-6 md:py-6">{children}</section>
      </div>
    </div>
  );
}
