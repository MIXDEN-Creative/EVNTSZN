"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Org = { id: string; name: string; created_at: string };
type Order = { amount_cents: number; created_at: string };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function iso(d: Date) {
  return d.toISOString();
}

export default function RevenuePage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todayCents, setTodayCents] = useState(0);
  const [weekCents, setWeekCents] = useState(0);
  const [monthCents, setMonthCents] = useState(0);
  const [lifeCents, setLifeCents] = useState(0);

  const [daily, setDaily] = useState<{ day: string; cents: number }[]>([]);

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
      setTodayCents(0);
      setWeekCents(0);
      setMonthCents(0);
      setLifeCents(0);
      setDaily([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)); // last 7 days incl today
    const monthStart = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)); // last 30 days incl today

    // Lifetime
    const { data: allOrders, error: allErr } = await supabase
      .from("orders")
      .select("amount_cents, created_at")
      .eq("org_id", orgId);

    if (allErr) {
      setError(allErr.message);
      setLoading(false);
      return;
    }

    const orders = (allOrders as Order[]) ?? [];
    const lifetime = orders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
    setLifeCents(lifetime);

    // Today
    const today = orders
      .filter((o) => new Date(o.created_at) >= todayStart)
      .reduce((sum, o) => sum + (o.amount_cents || 0), 0);
    setTodayCents(today);

    // 7 days
    const week = orders
      .filter((o) => new Date(o.created_at) >= weekStart)
      .reduce((sum, o) => sum + (o.amount_cents || 0), 0);
    setWeekCents(week);

    // 30 days
    const month = orders
      .filter((o) => new Date(o.created_at) >= monthStart)
      .reduce((sum, o) => sum + (o.amount_cents || 0), 0);
    setMonthCents(month);

    // Daily series for last 14 days
    const days: { day: string; cents: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const nextDay = startOfDay(new Date(dayStart.getTime() + 24 * 60 * 60 * 1000));
      const cents = orders
        .filter((o) => new Date(o.created_at) >= dayStart && new Date(o.created_at) < nextDay)
        .reduce((sum, o) => sum + (o.amount_cents || 0), 0);

      const label = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ day: label, cents });
    }
    setDaily(days);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Revenue</h1>
            <p className="text-sm text-gray-600">Quick revenue health check.</p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-xl border px-3 py-2 text-sm" href="/orders">Orders</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/products">Products</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/dashboard">Dashboard</a>
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
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border p-5">
                <div className="text-xs text-gray-500">Today</div>
                <div className="mt-1 text-2xl font-semibold">{money(todayCents)}</div>
              </div>
              <div className="rounded-2xl border p-5">
                <div className="text-xs text-gray-500">Last 7 days</div>
                <div className="mt-1 text-2xl font-semibold">{money(weekCents)}</div>
              </div>
              <div className="rounded-2xl border p-5">
                <div className="text-xs text-gray-500">Last 30 days</div>
                <div className="mt-1 text-2xl font-semibold">{money(monthCents)}</div>
              </div>
              <div className="rounded-2xl border p-5">
                <div className="text-xs text-gray-500">Lifetime</div>
                <div className="mt-1 text-2xl font-semibold">{money(lifeCents)}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Last 14 days</h2>
                <button onClick={load} className="rounded-xl border px-3 py-2 text-sm">
                  Refresh
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {daily.map((d) => (
                  <div key={d.day} className="flex items-center justify-between rounded-xl border p-3">
                    <div className="text-sm">{d.day}</div>
                    <div className="text-sm font-medium">{money(d.cents)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
