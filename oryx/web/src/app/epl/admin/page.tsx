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
    permissions.includes("catalog.manage") && {
      title: "Storefront",
      href: `${getEplOrigin(host)}/store`,
      description: "View the curated customer storefront and merch experience.",
    },
  ].filter(Boolean) as { title: string; href: string; description: string }[];

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">Overview</h1>
        <p className="mt-2 text-white/65">
          One place to run EVNTSZN merch, customer rewards, and admin access.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05]"
            >
              <div className="text-2xl font-bold">{card.title}</div>
              <div className="mt-3 text-white/65">{card.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
