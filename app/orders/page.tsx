"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Org = { id: string; name: string; created_at: string };
type Product = { id: string; name: string; price_cents: number };
type Order = {
  id: string;
  org_id: string;
  product_id: string | null;
  buyer_email: string | null;
  amount_cents: number;
  source: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [productId, setProductId] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [amount, setAmount] = useState("29.00");
  const [source, setSource] = useState("manual");

  async function load() {
    setLoading(true);
    setError(null);

    const { data: orgData, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (orgErr) {
      setError(orgErr.message);
      setLoading(false);
      return;
    }

    setOrgs(orgData ?? []);
    const orgId = activeOrgId ?? orgData?.[0]?.id ?? null;
    setActiveOrgId(orgId);

    if (!orgId) {
      setProducts([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select("id,name,price_cents")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (prodErr) {
      setError(prodErr.message);
      setLoading(false);
      return;
    }

    setProducts((prodData as Product[]) ?? []);

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (orderErr) {
      setError(orderErr.message);
      setLoading(false);
      return;
    }

    setOrders((orderData as Order[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function money(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  async function addOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;

    setBusy(true);
    setError(null);

    const amountNum = Number(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a valid number greater than 0.");
      setBusy(false);
      return;
    }
    const amountCents = Math.round(amountNum * 100);

    const cleanEmail = buyerEmail.trim();

    const { error } = await supabase.from("orders").insert({
      org_id: activeOrgId,
      product_id: productId ? productId : null,
      buyer_email: cleanEmail ? cleanEmail : null,
      amount_cents: amountCents,
      source,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    setBuyerEmail("");
    setAmount("29.00");
    setSource("manual");
    await load();
    setBusy(false);
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;

    setBusy(true);
    setError(null);

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    await load();
    setBusy(false);
  }

  const totalCents = orders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  function productName(id: string | null) {
    if (!id) return "No product";
    return products.find((p) => p.id === id)?.name ?? "Unknown product";
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="text-sm text-gray-600">Track sales across Gumroad, Ko-fi, Shopify, or manual.</p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-xl border px-3 py-2 text-sm" href="/products">
              Products
            </a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/dashboard">
              Dashboard
            </a>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6">Loading…</p>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Organization</h2>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={activeOrgId ?? ""}
                  onChange={(e) => setActiveOrgId(e.target.value)}
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Total revenue (listed orders): <span className="font-semibold">{money(totalCents)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <h2 className="text-lg font-semibold">Add Order</h2>

              <form onSubmit={addOrder} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <select
                  className="rounded-xl border px-3 py-2"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">No product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({money(p.price_cents)})
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Buyer email (optional)"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Amount (example 29.00)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <select
                  className="rounded-xl border px-3 py-2"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="manual">manual</option>
                  <option value="gumroad">gumroad</option>
                  <option value="ko-fi">ko-fi</option>
                  <option value="shopify">shopify</option>
                  <option value="stripe">stripe</option>
                  <option value="other">other</option>
                </select>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                  {busy ? "Working..." : "Add"}
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Order List</h2>
                <button
                  onClick={load}
                  disabled={busy}
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-600">No orders yet.</p>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div>
                        <div className="font-medium">{money(o.amount_cents)} · {productName(o.product_id)}</div>
                        <div className="text-sm text-gray-700">{o.source ?? "unknown source"}</div>
                        <div className="text-xs text-gray-500">{o.buyer_email ?? "no email"}</div>
                        <div className="text-xs text-gray-500 font-mono">{o.id}</div>
                      </div>
                      <button
                        onClick={() => deleteOrder(o.id)}
                        disabled={busy}
                        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
