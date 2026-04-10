import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin, getAdminPermissions } from "@/lib/admin-auth";
import { getAdminOrigin, getEplOrigin } from "@/lib/domains";

export default async function AdminHomePage() {
  const { user } = await requireAdmin("/epl/admin");
  const host = (await headers()).get("host") || undefined;
  const permissions = await getAdminPermissions(user.id);

  const cards = [
    permissions.includes("orders.view") && {
      title: "Merch Orders",
      href: `${getAdminOrigin(host)}/merch-orders`,
      description: "Track fulfillment, refunds, resend, and order history.",
    },
    permissions.includes("admin.manage") && {
      title: "Payouts",
      href: `${getAdminOrigin(host)}/payouts`,
      description: "Review locked earnings, create manual payouts, and track sent versus released funds.",
    },
    permissions.includes("rewards.view") && {
      title: "Rewards",
      href: `${getAdminOrigin(host)}/rewards`,
      description: "Manage point settings, redemption logic, and member balances.",
    },
    permissions.includes("admin.manage") && {
      title: "Team & Access",
      href: `${getAdminOrigin(host)}/team`,
      description: "Create access profiles, scope roles, and onboard staff safely.",
    },
    permissions.includes("admin.manage") && {
      title: "Control Center",
      href: `${getAdminOrigin(host)}/control-center`,
      description: "See revenue, approvals, open issues, and what needs attention today.",
    },
    permissions.includes("admin.manage") && {
      title: "Users",
      href: `${getAdminOrigin(host)}/users`,
      description: "Create users and update city, scanner, and operator access.",
    },
    permissions.includes("admin.manage") && {
      title: "Approvals",
      href: `${getAdminOrigin(host)}/approvals`,
      description: "Review applications, assign reviewers, and move decisions forward.",
    },
    permissions.includes("city.manage") && {
      title: "City Office",
      href: `${getAdminOrigin(host)}/city-office`,
      description: "Review city queues, operator coverage, and local revenue.",
    },
    (permissions.includes("admin.manage") || permissions.includes("city.manage")) && {
      title: "Programs",
      href: `${getAdminOrigin(host)}/programs`,
      description: "Review Signal and Ambassador applicants and update status.",
    },
    permissions.includes("admin.manage") && {
      title: "Hiring",
      href: `${getAdminOrigin(host)}/hiring`,
      description: "Review applications, interviews, and hiring decisions.",
    },
    permissions.includes("opportunities.manage") && {
      title: "Opportunities",
      href: `${getAdminOrigin(host)}/opportunities`,
      description: "Manage staffing templates, open positions, assignments, and applicants.",
    },
    (permissions.includes("workforce.view") || permissions.includes("workforce.manage") || permissions.includes("workforce.approve")) && {
      title: "Workforce",
      href: `${getAdminOrigin(host)}/workforce`,
      description: "Review hours, payroll-ready time, and labor exceptions across staff and events.",
    },
    permissions.includes("events.manage") && {
      title: "Events",
      href: `${getAdminOrigin(host)}/events`,
      description: "Create, publish, and update events and ticketing.",
    },
    permissions.includes("scanner.manage") && {
      title: "Scanner",
      href: `${getAdminOrigin(host)}/scanner`,
      description: "Manage gate access and event scan coverage.",
    },
    (permissions.includes("support.manage") || permissions.includes("support.respond")) && {
      title: "Support Desk",
      href: `${getAdminOrigin(host)}/support`,
      description: "Review support tickets, assign owners, and close the loop.",
    },
    permissions.includes("admin.manage") && {
      title: "System Issues",
      href: `${getAdminOrigin(host)}/issues`,
      description: "Review and resolve platform, store, and webhook issues.",
    },
    permissions.includes("catalog.manage") && {
      title: "Storefront",
      href: `${getEplOrigin(host)}/store`,
      description: "View the curated customer storefront and merch experience.",
    },
    permissions.includes("catalog.manage") && {
      title: "Discovery Control",
      href: `${getAdminOrigin(host)}/discovery`,
      description: "Manage public copy, featured listings, and external moderation.",
    },
    permissions.includes("catalog.manage") && {
      title: "Sponsors & Packages",
      href: `${getAdminOrigin(host)}/sponsors`,
      description: "Manage sponsor accounts, placements, and package orders.",
    },
  ].filter(Boolean) as { title: string; href: string; description: string }[];

  return (
    <main className="mx-auto max-w-6xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Admin dashboard</div>
            <h1 className="ev-title">Run daily EVNTSZN operations from one place.</h1>
            <p className="ev-subtitle">
              Pick a system area, handle the next action, and move back out. This dashboard is for daily work, not a product overview.
            </p>
          </div>
          <div className="ev-hero-meta">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Permissions</div>
              <div className="ev-meta-value">{permissions.length} permission codes are active for this account.</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Use</div>
              <div className="ev-meta-value">Open a desk, complete the task, then move to the next queue.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="ev-panel hover:bg-white/[0.05]"
            >
              <div className="ev-section-kicker">System area</div>
              <div className="mt-3 text-2xl font-bold">{card.title}</div>
              <div className="mt-3 text-white/65">{card.description}</div>
            </Link>
          ))}
      </div>
    </main>
  );
}
