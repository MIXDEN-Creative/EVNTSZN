import { redirect } from "next/navigation";
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
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black">My Account</h1>
            <p className="mt-2 text-white/65">{user.email}</p>
          </div>

          <form action="/account/logout" method="POST">
            <button className="rounded-2xl border border-white/15 px-5 py-3 hover:bg-white/10">
              Sign Out
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Rewards Wallet</h2>
            <div className="mt-4 grid gap-3 text-white/75">
              <div>Tier: {wallet?.tier || "Member"}</div>
              <div>Available Points: {wallet?.available_points || 0}</div>
              <div>Lifetime Points: {wallet?.lifetime_points || 0}</div>
              <div>Points Redeemed: {wallet?.points_redeemed || 0}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
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
                <div className="text-white/50">No orders yet.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Issued Tickets</h2>
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
              <div className="text-white/50">No EVNTSZN tickets issued yet.</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Rewards Activity</h2>
          <div className="mt-4 space-y-3">
            {(ledger || []).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-semibold">{entry.event_type}</div>
                <div className="text-white/65">{entry.description || "No description"}</div>
                <div className="text-[#A259FF]">{entry.points > 0 ? `+${entry.points}` : entry.points} pts</div>
              </div>
            ))}
            {(!ledger || ledger.length === 0) ? (
              <div className="text-white/50">No rewards activity yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
