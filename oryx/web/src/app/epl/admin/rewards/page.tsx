"use client";

import { useEffect, useMemo, useState } from "react";

type RewardSettings = {
  points_per_dollar: number;
  first_order_bonus: number;
  redemption_enabled: boolean;
  redemption_value_cents: number;
  minimum_points_to_redeem: number;
  assigned_manager_user_id?: string | null;
};

type RewardAccount = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  tier: string | null;
  available_points: number;
  lifetime_points: number;
  total_spent: number | null;
  orders_count: number | null;
};

type OperatorUser = {
  user_id: string;
  full_name: string | null;
  email?: string | null;
};

export default function AdminRewardsPage() {
  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [accounts, setAccounts] = useState<RewardAccount[]>([]);
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function loadData() {
    setLoading(true);

    const [settingsRes, accountsRes, operatorsRes] = await Promise.all([
      fetch("/api/admin/rewards/settings", { cache: "no-store" }),
      fetch("/api/admin/rewards/accounts", { cache: "no-store" }),
      fetch("/api/admin/operator-users", { cache: "no-store" }),
    ]);

    const settingsData = (await settingsRes.json()) as Record<string, any>;
    const accountsData = (await accountsRes.json()) as Record<string, any>;
    const operatorsData = (await operatorsRes.json()) as Record<string, any>;

    if (settingsRes.ok) setSettings(settingsData.settings);
    if (accountsRes.ok) setAccounts(accountsData.accounts || []);
    if (operatorsRes.ok) setOperators(operatorsData.users || []);
    if (!settingsRes.ok || !accountsRes.ok || !operatorsRes.ok) {
      setMessage(
        settingsData.error || accountsData.error || operatorsData.error || "Could not load the rewards desk.",
      );
    } else {
      setMessage(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return accounts;
    return accounts.filter((account) =>
      [account.customer_name, account.customer_email, account.tier]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [accounts, query]);

  const summary = useMemo(
    () => ({
      members: accounts.length,
      availablePoints: accounts.reduce((sum, account) => sum + Number(account.available_points || 0), 0),
      lifetimePoints: accounts.reduce((sum, account) => sum + Number(account.lifetime_points || 0), 0),
      activeTiers: new Set(accounts.map((account) => account.tier).filter(Boolean)).size,
    }),
    [accounts],
  );

  const assignedOwner = useMemo(
    () => operators.find((user) => user.user_id === settings?.assigned_manager_user_id) || null,
    [operators, settings?.assigned_manager_user_id],
  );

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

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
      setMessage(data.error || "Failed to save rewards settings.");
      return;
    }

    setMessage("Rewards settings updated.");
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
    <main className="mx-auto max-w-[1500px] p-6">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Rewards</div>
            <h1 className="ev-title">Own the member rewards program from one operational desk.</h1>
            <p className="ev-subtitle">
              Assign an internal owner, keep the earning and redemption rules clear, and review live member balances without leaving the desk.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Accounts", summary.members],
              ["Active tiers", summary.activeTiers],
              ["Available points", summary.availablePoints],
              ["Lifetime points", summary.lifetimePoints],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-meta-card">
                <div className="ev-meta-label">{label}</div>
                <div className="ev-meta-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Program ownership</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Assign who owns rewards day to day</h2>
            <p className="mt-2 text-sm text-white/60">
              Keep a clear operator on the desk so changes to earning rules, redemption policy, and member issues have an accountable owner.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Assigned owner</div>
                <div className="mt-3 text-lg font-semibold text-white">
                  {assignedOwner?.full_name || assignedOwner?.email || "Unassigned"}
                </div>
                <div className="mt-2 text-sm text-white/58">
                  {assignedOwner ? "This operator should handle rewards rule updates and account issues." : "Pick an internal owner for rewards operations."}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Redemption</div>
                <div className="mt-3 text-lg font-semibold text-white">
                  {settings.redemption_enabled ? "Enabled" : "Paused"}
                </div>
                <div className="mt-2 text-sm text-white/58">
                  Minimum {settings.minimum_points_to_redeem} points · {settings.redemption_value_cents} cents per redemption unit
                </div>
              </div>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Program settings</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Keep the earning rules clear</h2>

            <div className="mt-6 grid gap-6">
              <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Ownership</div>
                  <div className="mt-2 text-lg font-semibold text-white">Who is responsible for this desk?</div>
                </div>
                <select
                  className="ev-field"
                  value={settings.assigned_manager_user_id || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, assigned_manager_user_id: e.target.value || null })
                  }
                >
                  <option value="">Unassigned</option>
                  {operators.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name || user.email || user.user_id}
                    </option>
                  ))}
                </select>
              </section>

              <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Earn rules</div>
                  <div className="mt-2 text-lg font-semibold text-white">Points and order bonuses</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Points per dollar</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.points_per_dollar}
                      onChange={(e) => setSettings({ ...settings, points_per_dollar: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">First order bonus</label>
                    <input
                      type="number"
                      value={settings.first_order_bonus}
                      onChange={(e) => setSettings({ ...settings, first_order_bonus: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Redemption rules</div>
                  <div className="mt-2 text-lg font-semibold text-white">How members use points</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Redemption value (cents)</label>
                    <input
                      type="number"
                      value={settings.redemption_value_cents}
                      onChange={(e) => setSettings({ ...settings, redemption_value_cents: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Minimum points to redeem</label>
                    <input
                      type="number"
                      value={settings.minimum_points_to_redeem}
                      onChange={(e) => setSettings({ ...settings, minimum_points_to_redeem: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={settings.redemption_enabled}
                    onChange={(e) => setSettings({ ...settings, redemption_enabled: e.target.checked })}
                  />
                  Redemption is available to members.
                </label>
              </section>

              <button onClick={saveSettings} disabled={saving} className="ev-button-primary disabled:opacity-50">
                {saving ? "Saving..." : "Save rewards settings"}
              </button>
            </div>
          </section>
        </section>

        <section className="ev-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="ev-section-kicker">Member accounts</div>
              <h2 className="mt-3 text-2xl font-bold text-white">Review balances and tier standing</h2>
              <p className="mt-2 text-sm text-white/60">
                Use this roster to review who is holding points, who is spending, and which members are sitting at the highest lifetime value.
              </p>
            </div>
            <input
              className="ev-field max-w-sm"
              placeholder="Search member or tier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-4">
            {filteredAccounts.map((account) => (
              <div key={account.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{account.customer_name || "No name"}</div>
                    <div className="mt-1 text-sm text-white/55">{account.customer_email || "No email on file"}</div>
                  </div>
                  <span className="ev-chip ev-chip--external">{account.tier || "standard"}</span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Available</div>
                    <div className="mt-2 text-lg font-semibold text-white">{account.available_points}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Lifetime</div>
                    <div className="mt-2 text-lg font-semibold text-white">{account.lifetime_points}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Total spent</div>
                    <div className="mt-2 text-lg font-semibold text-white">${((account.total_spent || 0) / 100).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Orders</div>
                    <div className="mt-2 text-lg font-semibold text-white">{account.orders_count || 0}</div>
                  </div>
                </div>
              </div>
            ))}

            {filteredAccounts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-white/50">No rewards accounts match the current search.</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
