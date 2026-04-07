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
    permissions.includes("rewards.view") && {
      title: "Rewards",
      href: `${getAdminOrigin(host)}/rewards`,
      description: "Manage point settings, redemption logic, and member balances.",
    },
    permissions.includes("admin.manage") && {
      title: "Team & Access",
      href: `${getAdminOrigin(host)}/team`,
      description: "Invite admins, assign roles, and control permissions.",
    },
    permissions.includes("admin.manage") && {
      title: "Control Center",
      href: `${getAdminOrigin(host)}/control-center`,
      description: "Monitor approvals, open issues, sponsorship money, and operator coverage from one executive summary.",
    },
    permissions.includes("admin.manage") && {
      title: "Users",
      href: `${getAdminOrigin(host)}/users`,
      description: "Create users, assign operator roles, and manage city or surface access.",
    },
    permissions.includes("admin.manage") && {
      title: "Approvals",
      href: `${getAdminOrigin(host)}/approvals`,
      description: "Review host, organizer, and partner applications and approve discovery eligibility.",
    },
    permissions.includes("admin.manage") && {
      title: "City Office",
      href: `${getAdminOrigin(host)}/city-office`,
      description: "Track market-level events, revenue, host coverage, and pending approvals city by city.",
    },
    permissions.includes("admin.manage") && {
      title: "Signal & Ambassador",
      href: `${getAdminOrigin(host)}/programs`,
      description: "Manage Signal and Ambassador pipelines as distinct internal programs with city-aware activation and review status.",
    },
    permissions.includes("admin.manage") && {
      title: "Hiring Pipeline",
      href: `${getAdminOrigin(host)}/hiring`,
      description: "Review EPL applications, assign interviews, capture notes, and convert hired applicants into users.",
    },
    permissions.includes("admin.manage") && {
      title: "Opportunities",
      href: `${getAdminOrigin(host)}/opportunities`,
      description: "Publish or close current EPL volunteer and paid roles without touching code.",
    },
    permissions.includes("admin.manage") && {
      title: "Scanner Access",
      href: `${getAdminOrigin(host)}/scanner`,
      description: "See who can work the gate, what city they cover, and which events they can scan.",
    },
    permissions.includes("admin.manage") && {
      title: "Issues & Health",
      href: `${getAdminOrigin(host)}/issues`,
      description: "Review operational failures, webhook trouble, and store issues from one monitored queue.",
    },
    permissions.includes("catalog.manage") && {
      title: "Storefront",
      href: `${getEplOrigin(host)}/store`,
      description: "View the curated customer storefront and merch experience.",
    },
    permissions.includes("catalog.manage") && {
      title: "Discovery Control",
      href: `${getAdminOrigin(host)}/discovery`,
      description: "Manage homepage hero content, featured listings, taxonomy blocks, and public discovery hierarchy.",
    },
    permissions.includes("catalog.manage") && {
      title: "Sponsors & Packages",
      href: `${getAdminOrigin(host)}/sponsors`,
      description: "Manage sponsor placements, package orders, live readiness, and payment-backed partner operations.",
    },
  ].filter(Boolean) as { title: string; href: string; description: string }[];

  return (
    <main className="mx-auto max-w-6xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Admin Overview</div>
            <h1 className="ev-title">Executive control across EVNTSZN.</h1>
            <p className="ev-subtitle">
              One place to run merch, customer rewards, and access control while keeping attendee, scanner, and ops experiences separated.
            </p>
          </div>
          <div className="ev-hero-meta">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Permissions live</div>
              <div className="ev-meta-value">{permissions.length} permission codes active for this account.</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Surface</div>
              <div className="ev-meta-value">Administrative tools remain distinct from HQ and public league surfaces.</div>
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
              <div className="ev-section-kicker">Control surface</div>
              <div className="mt-3 text-2xl font-bold">{card.title}</div>
              <div className="mt-3 text-white/65">{card.description}</div>
            </Link>
          ))}
      </div>
    </main>
  );
}
