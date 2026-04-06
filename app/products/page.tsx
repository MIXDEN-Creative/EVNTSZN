"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Org = { id: string; name: string; created_at: string };
type Product = {
  id: string;
  org_id: string;
  name: string;
  price_cents: number;
  status: string;
  created_at: string;
};

export default function ProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("29.00");
  const [status, setStatus] = useState("active");

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

    if (orgId) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProducts((data as Product[]) ?? []);
    } else {
      setProducts([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;

    setBusy(true);
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Product name is required.");
      setBusy(false);
      return;
    }

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a valid number.");
      setBusy(false);
      return;
    }

    const priceCents = Math.round(priceNum * 100);

    const { error } = await supabase.from("products").insert({
      org_id: activeOrgId,
      name: cleanName,
      price_cents: priceCents,
      status,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    setName("");
    setPrice("29.00");
    setStatus("active");
    await load();
    setBusy(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    await load();
    setBusy(false);
  }

  function money(cents: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-sm text-gray-600">Create and manage what MIXDEN sells.</p>
          </div>
          <a className="rounded-xl border px-3 py-2 text-sm" href="/dashboard">
            Dashboard
          </a>
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
                Active Org ID: <span className="font-mono">{activeOrgId}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <h2 className="text-lg font-semibold">Add Product</h2>

              <form onSubmit={addProduct} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Price (example 29.00)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />

                <select
                  className="rounded-xl border px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
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
                <h2 className="text-lg font-semibold">Product List</h2>
                <button
                  onClick={load}
                  disabled={busy}
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-600">No products yet.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-700">{money(p.price_cents)} · {p.status}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.id}</div>
                      </div>
                      <button
                        onClick={() => deleteProduct(p.id)}
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
