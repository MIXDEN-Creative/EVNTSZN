"use client";

import { useState } from "react";

type OrderLookupResult = {
  order: {
    public_order_number: string;
    created_at: string;
    product_name: string;
    quantity: number;
    amount_total: number;
    status: string;
    fulfillment_status: string;
    reward_points_earned: number;
  };
  rewards: {
    tier: string;
    available_points: number;
    lifetime_points: number;
    total_spent: number;
    orders_count: number;
  } | null;
};

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<OrderLookupResult | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          orderNumber,
        }),
      });

      const data = (await res.json()) as OrderLookupResult & { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Lookup failed");
      }

      setResult(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Lookup failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-4xl font-black">Track Your Order</h1>
          <p className="mt-3 text-white/65">
            Enter your order number and email to view your order and rewards.
          </p>

          <form onSubmit={handleLookup} className="mt-6 grid gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="EPL-XXXXXXXXXX"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
            >
              {loading ? "Checking..." : "Track Order"}
            </button>
          </form>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                  {result.order.status} • {result.order.fulfillment_status}
                </div>
                <h2 className="mt-2 text-2xl font-bold">
                  {result.order.product_name}
                </h2>
                <div className="mt-3 grid gap-2 text-sm text-white/70">
                  <div>Order Number: {result.order.public_order_number}</div>
                  <div>Quantity: {result.order.quantity}</div>
                  <div>Total: ${((result.order.amount_total || 0) / 100).toFixed(2)}</div>
                  <div>Rewards Earned: {result.order.reward_points_earned || 0}</div>
                  <div>
                    Created: {new Date(result.order.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {result.rewards ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <h3 className="text-xl font-bold">Rewards</h3>
                  <div className="mt-3 grid gap-2 text-sm text-white/70">
                    <div>Tier: {result.rewards.tier}</div>
                    <div>Available Points: {result.rewards.available_points}</div>
                    <div>Lifetime Points: {result.rewards.lifetime_points}</div>
                    <div>Total Spent: ${((result.rewards.total_spent || 0) / 100).toFixed(2)}</div>
                    <div>Orders: {result.rewards.orders_count}</div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
