import { redirect } from "next/navigation";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/login");
  }

  const { data: wallet } = await supabase
    .from("customer_reward_wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: ledger } = await supabase
    .from("customer_reward_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: orders } = await supabase
    .from("merch_orders")
    .select("public_order_number,created_at,product_name,amount_total,status,fulfillment_status,reward_points_earned")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: tickets } = await supabase
    .from("evntszn_tickets")
    .select("ticket_code,share_code,referral_code,status,attendee_name,attendee_email,evntszn_events(title,slug)")
    .eq("purchaser_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <SurfaceShell
      surface="app"
      eyebrow="Member portal"
      title="Your EVNTSZN account"
      description="Tickets, rewards, orders, and member activity live in one premium account surface with clean separation from scanner, ops, and command environments."
      actions={
        <form action="/account/logout" method="POST">
          <button className="ev-button-secondary">
            Sign Out
          </button>
        </form>
      }
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Signed in as</div>
            <div className="ev-meta-value">{user.email}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Rewards wallet</div>
            <div className="ev-meta-value">
              {wallet?.available_points || 0} points available · {wallet?.tier || "Member"} tier
            </div>
          </div>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="ev-panel">
          <div className="ev-section-kicker">Rewards</div>
          <h2 className="ev-panel-title mt-3">Wallet snapshot</h2>
          <div className="mt-5 grid gap-3 text-white/75">
            <div>Tier: {wallet?.tier || "Member"}</div>
            <div>Available Points: {wallet?.available_points || 0}</div>
            <div>Lifetime Points: {wallet?.lifetime_points || 0}</div>
            <div>Points Redeemed: {wallet?.points_redeemed || 0}</div>
          </div>
        </section>

        <section className="ev-panel">
          <div className="ev-section-kicker">Orders</div>
          <h2 className="ev-panel-title mt-3">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {(orders || []).map((order) => (
              <div key={order.public_order_number} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                  {order.status} • {order.fulfillment_status}
                </div>
                <div className="mt-2 font-bold">{order.product_name}</div>
                <div className="text-white/65">{order.public_order_number}</div>
                <div className="text-white/65">${((order.amount_total || 0) / 100).toFixed(2)}</div>
                <div className="text-white/65">Rewards Earned: {order.reward_points_earned || 0}</div>
              </div>
            ))}
            {(!orders || orders.length === 0) ? (
              <div className="ev-empty">No orders yet.</div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 ev-panel">
        <div className="ev-section-kicker">Tickets</div>
        <h2 className="ev-panel-title mt-3">Issued tickets</h2>
        <div className="mt-4 space-y-3">
            {(tickets || []).map((ticket) => {
              const event = Array.isArray(ticket.evntszn_events)
                ? ticket.evntszn_events[0]
                : ticket.evntszn_events;

              return (
                <div key={ticket.ticket_code} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">{ticket.status}</div>
                  <div className="mt-2 font-bold">{event?.title || "EVNTSZN event"}</div>
                  <div className="text-white/65">{ticket.ticket_code}</div>
                  <div className="mt-2 text-sm text-white/65">
                    Share code: {ticket.share_code || "Pending"}
                  </div>
                  <div className="text-sm text-white/65">
                    Referral code: {ticket.referral_code || "Pending"}
                  </div>
                </div>
              );
            })}

            {(!tickets || tickets.length === 0) ? (
              <div className="ev-empty">No EVNTSZN tickets issued yet.</div>
            ) : null}
        </div>
      </div>

      <div className="mt-6 ev-panel">
        <div className="ev-section-kicker">Activity</div>
        <h2 className="ev-panel-title mt-3">Rewards activity</h2>
        <div className="mt-4 space-y-3">
            {(ledger || []).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-semibold">{entry.event_type}</div>
                <div className="text-white/65">{entry.description || "No description"}</div>
                <div className="text-[#A259FF]">{entry.points > 0 ? `+${entry.points}` : entry.points} pts</div>
              </div>
            ))}
            {(!ledger || ledger.length === 0) ? (
              <div className="ev-empty">No rewards activity yet.</div>
            ) : null}
        </div>
      </div>
    </SurfaceShell>
  );
}
