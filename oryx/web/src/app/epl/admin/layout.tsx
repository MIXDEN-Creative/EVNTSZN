import Image from "next/image";
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
  const canViewWorkforce =
    permissions.includes("workforce.view") || permissions.includes("workforce.manage") || permissions.includes("workforce.approve");

  const roleNames = memberships
    .map((m: any) => m.admin_roles?.name)
    .filter(Boolean)
    .join(", ");

  type NavLink = { href: string; label: string };
  const navSections = [
    {
      label: "Overview",
      links: [
        { href: isHqSurface ? getHqOrigin(host) : getAdminOrigin(host), label: isHqSurface ? "HQ Overview" : "Overview" },
        canManageAdmins ? { href: `${getAdminOrigin(host)}/control-center`, label: "Control Center" } : null,
      ].filter(Boolean) as NavLink[],
    },
    {
      label: "Events",
      links: [
        canManageEvents ? { href: `${getAdminOrigin(host)}/events`, label: "Events" } : null,
        canManageCatalog ? { href: `${getAdminOrigin(host)}/discovery`, label: "Discovery" } : null,
        canManageScanner ? { href: `${getAdminOrigin(host)}/scanner`, label: "Scanner" } : null,
      ].filter(Boolean) as NavLink[],
    },
    {
      label: "Team",
      links: [
        canManageAdmins ? { href: `${getAdminOrigin(host)}/team`, label: "Team & Access" } : null,
        canManageAdmins ? { href: `${getAdminOrigin(host)}/approvals`, label: "Approvals" } : null,
        canManageAdmins ? { href: `${getAdminOrigin(host)}/hiring`, label: "Hiring" } : null,
        canManageOpportunities ? { href: `${getAdminOrigin(host)}/opportunities`, label: "Opportunities" } : null,
      ].filter(Boolean) as NavLink[],
    },
    {
      label: "Operations",
      links: [
        canManageCity ? { href: `${getAdminOrigin(host)}/city-office`, label: "Offices" } : null,
        canViewWorkforce ? { href: `${getAdminOrigin(host)}/workforce`, label: "Workforce" } : null,
        canManageAdmins ? { href: `${getAdminOrigin(host)}/draft`, label: "Draft Console" } : null,
        canManagePrograms ? { href: `${getAdminOrigin(host)}/programs`, label: "Programs" } : null,
        canManageSupport ? { href: `${getAdminOrigin(host)}/support`, label: "Support" } : null,
        canManageAdmins ? { href: `${getAdminOrigin(host)}/issues`, label: "Issues & Health" } : null,
      ].filter(Boolean) as NavLink[],
    },
    {
      label: "Revenue",
      links: [
        canManageAdmins ? { href: `${getAdminOrigin(host)}/payouts`, label: "Payouts" } : null,
        canViewOrders ? { href: `${getAdminOrigin(host)}/merch-orders`, label: "Merch Orders" } : null,
        canViewRewards ? { href: `${getAdminOrigin(host)}/rewards`, label: "Rewards" } : null,
        canManageCatalog ? { href: `${getAdminOrigin(host)}/sponsors`, label: "Sponsors" } : null,
        canManageCatalog ? { href: `${getEplOrigin(host)}/store`, label: "Store" } : null,
      ].filter(Boolean) as NavLink[],
    },
    {
      label: "HQ",
      links: [
        isHqSurface ? { href: `${getHqOrigin(host)}/draft`, label: "Draft Console" } : null,
      ].filter(Boolean) as NavLink[],
    },
  ].filter((section) => section.links.length);

  return (
    <div className={`ev-surface ${isHqSurface ? "ev-surface--hq" : "ev-surface--admin"} text-white`}>
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(9,9,12,0.96),rgba(5,5,8,0.96))] p-6">
          <div className="ev-kicker">{isHqSurface ? "EVNTSZN HQ" : "EVNTSZN Admin"}</div>

          <div className="mt-4 flex items-center gap-3">
            <Link href="https://evntszn.com" className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
              <span className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="40px" className="object-cover" />
              </span>
              <span className="flex flex-col">
                <span>EVNTSZN</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {isHqSurface ? "HQ operations" : "Admin operations"}
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="https://app.evntszn.com/account" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.08]">
              Member account
            </Link>
            <Link href="https://epl.evntszn.com" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.08]">
              EPL
            </Link>
          </div>

          <div className="mt-5">
            <div className="text-2xl font-black">{isHqSurface ? "HQ workspace" : "Admin workspace"}</div>
            <div className="mt-2 text-sm text-white/60">{user.email}</div>
            <div className="mt-1 text-sm text-[#A259FF]">{roleNames || "Admin"}</div>
          </div>

          <nav className="mt-8 grid gap-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/38">{section.label}</div>
                <div className="grid gap-3">
                  {section.links.map((link) => (
                    <Link key={link.href} href={link.href} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.08]">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
