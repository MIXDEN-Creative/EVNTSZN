"use client";

import { useEffect, useState } from "react";

export default function AdminRewardsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    const [settingsRes, accountsRes] = await Promise.all([
      fetch("/api/admin/rewards/settings", { cache: "no-store" }),
      fetch("/api/admin/rewards/accounts", { cache: "no-store" }),
    ]);

    const settingsData = (await settingsRes.json()) as Record<string, any>;
    const accountsData = (await accountsRes.json()) as Record<string, any>;

    if (settingsRes.ok) setSettings(settingsData.settings);
    if (accountsRes.ok) setAccounts(accountsData.accounts || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveSettings() {
    setSaving(true);

    const res = await fetch("/api/admin/rewards/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    const data = (await res.json()) as Record<string, any>;

    setSaving(false);

    if (!res.ok) {
      alert(data.error || "Failed to save settings");
      return;
    }

    alert("Rewards settings updated");
    loadData();
  }

  if (loading || !settings) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-7xl text-white/60">Loading rewards...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">Rewards</h1>
        <p className="mt-2 text-white/65">Configure the program and monitor wallet balances.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Program Settings</h2>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Points Per Dollar</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.points_per_dollar}
                  onChange={(e) =>
                    setSettings({ ...settings, points_per_dollar: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">First Order Bonus</label>
                <input
                  type="number"
                  value={settings.first_order_bonus}
                  onChange={(e) =>
                    setSettings({ ...settings, first_order_bonus: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Redemption Value (cents)</label>
                <input
                  type="number"
                  value={settings.redemption_value_cents}
                  onChange={(e) =>
                    setSettings({ ...settings, redemption_value_cents: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Minimum Points To Redeem</label>
                <input
                  type="number"
                  value={settings.minimum_points_to_redeem}
                  onChange={(e) =>
                    setSettings({ ...settings, minimum_points_to_redeem: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-3 text-white/80">
                <input
                  type="checkbox"
                  checked={settings.redemption_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, redemption_enabled: e.target.checked })
                  }
                />
                Redemption Enabled
              </label>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Member Accounts</h2>

            <div className="mt-5 space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-bold">{account.customer_name || "No name"}</div>
                      <div className="text-white/55">{account.customer_email}</div>
                    </div>
                    <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                      {account.tier}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-white/70 md:grid-cols-2">
                    <div>Available Points: {account.available_points}</div>
                    <div>Lifetime Points: {account.lifetime_points}</div>
                    <div>Total Spent: ${((account.total_spent || 0) / 100).toFixed(2)}</div>
                    <div>Orders: {account.orders_count}</div>
                  </div>
                </div>
              ))}

              {accounts.length === 0 ? (
                <div className="text-white/50">No rewards accounts yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
