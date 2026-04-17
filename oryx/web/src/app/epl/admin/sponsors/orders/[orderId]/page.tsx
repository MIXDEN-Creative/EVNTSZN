import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function SponsorOrderDetailPage({ params }: PageProps) {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  const { orderId } = await params;

  const { data: order, error } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Sponsor order detail</div>
            <h1 className="ev-title">{order.company_name}</h1>
            <p className="ev-subtitle">
              Review the package, payment state, sponsor readiness, and follow-up notes tied to this sponsor or partner order.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 ev-panel p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Package", order.package_name || "Not set"],
            ["Order type", order.order_type],
            ["Order status", order.status],
            ["Amount", `$${Number(order.amount_usd || 0).toLocaleString()}`],
            ["Contact", order.contact_name || "Not set"],
            ["Email", order.contact_email],
            ["Phone", order.contact_phone || "Not set"],
            ["Sponsor record", order.sponsor_partner_id || "Not linked"],
            ["Checkout session", order.stripe_checkout_session_id || "Not linked"],
            ["Payment intent", order.stripe_payment_intent_id || "Not linked"],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
              <div className="mt-2 text-sm leading-7 text-white/78">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">Internal notes</div>
          <div className="mt-2 text-sm leading-7 text-white/72">{order.notes || "No internal notes recorded yet."}</div>
        </div>
      </section>
    </main>
  );
}
