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
    <main className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Rewards</div>
            <h1 className="ev-title">Own the member rewards program from one operational desk.</h1>
            <p className="ev-subtitle">
              Assign an internal owner, keep the earning and redemption rules clear, and review live member balances without leaving the desk.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Accounts", summary.members],
              ["Active Tiers", summary.activeTiers],
              ["Available Points", summary.availablePoints],
              ["Lifetime Points", summary.lifetimePoints],
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

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-8">
          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Program ownership</div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Assign management</h2>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-2xl">
              Keep a clear operator on the desk so changes to earning rules, redemption policy, and member issues have an accountable owner.
            </p>
            
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 lg:p-8">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-4">Assigned owner</div>
                <div className="text-xl font-bold text-white tracking-tight leading-tight">
                  {assignedOwner?.full_name || assignedOwner?.email || "Unassigned"}
                </div>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">
                  {assignedOwner ? "This operator should handle rewards rule updates and account issues." : "Pick an internal owner for rewards operations."}
                </p>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-[#caa7ff]/5 p-6 lg:p-8">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#caa7ff]/40 mb-4">Redemption Status</div>
                <div className={`text-xl font-bold tracking-tight leading-tight ${settings.redemption_enabled ? "text-emerald-400" : "text-amber-400"}`}>
                  {settings.redemption_enabled ? "Active & Enabled" : "Paused"}
                </div>
                <p className="mt-3 text-sm text-[#caa7ff]/60 leading-relaxed">
                  Min. {settings.minimum_points_to_redeem} pts · {settings.redemption_value_cents}¢ per unit
                </p>
              </div>
            </div>
          </section>

          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Program settings</div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Earning & Redemption Rules</h2>

            <div className="mt-10 grid gap-8">
              <div className="grid gap-6 p-6 rounded-[32px] border border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Configuration</div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Desk Manager</label>
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
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Points per dollar</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.points_per_dollar}
                      onChange={(e) => setSettings({ ...settings, points_per_dollar: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">First order bonus</label>
                    <input
                      type="number"
                      value={settings.first_order_bonus}
                      onChange={(e) => setSettings({ ...settings, first_order_bonus: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Redemption value (cents)</label>
                    <input
                      type="number"
                      value={settings.redemption_value_cents}
                      onChange={(e) => setSettings({ ...settings, redemption_value_cents: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Min points to redeem</label>
                    <input
                      type="number"
                      value={settings.minimum_points_to_redeem}
                      onChange={(e) => setSettings({ ...settings, minimum_points_to_redeem: Number(e.target.value || 0) })}
                      className="ev-field"
                    />
                  </div>
                  <div className="mt-6">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white/70 hover:bg-white/[0.05] transition cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-black/50"
                        checked={settings.redemption_enabled}
                        onChange={(e) => setSettings({ ...settings, redemption_enabled: e.target.checked })}
                      />
                      <span>Redemption available to members</span>
                    </label>
                  </div>
                </div>
              </div>

              <button onClick={saveSettings} disabled={saving} className="ev-button-primary w-full py-4 text-base disabled:opacity-50">
                {saving ? "Saving..." : "Save rewards settings"}
              </button>
            </div>
          </section>
        </section>

        <section className="ev-panel p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-white/5 pb-8">
            <div>
              <div className="ev-section-kicker">Member accounts</div>
              <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Review live balances</h2>
              <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-lg">
                Holding points, active spending, and member tier standings across the rewards network.
              </p>
            </div>
            <div className="w-full lg:w-72">
              <input
                className="ev-field bg-black/40"
                placeholder="Search name, email, tier"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 space-y-4 max-h-[1200px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAccounts.map((account) => (
              <div key={account.id} className="rounded-[32px] border border-white/5 bg-white/[0.02] p-6 lg:p-8 transition hover:bg-white/[0.04] hover:border-white/10 group">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xl font-bold text-white tracking-tight group-hover:text-[#caa7ff] transition-colors">{account.customer_name || "No name"}</div>
                    <div className="mt-1 text-sm text-white/40">{account.customer_email || "No email on file"}</div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#caa7ff]/20 bg-[#caa7ff]/5 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]">
                    {account.tier || "standard"}
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Available</div>
                    <div className="mt-1 text-lg font-bold text-white tracking-tight">{account.available_points}</div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Lifetime</div>
                    <div className="mt-1 text-lg font-bold text-white tracking-tight">{account.lifetime_points}</div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Spent</div>
                    <div className="mt-1 text-lg font-bold text-white tracking-tight">${((account.total_spent || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Orders</div>
                    <div className="mt-1 text-lg font-bold text-white tracking-tight">{account.orders_count || 0}</div>
                  </div>
                </div>
              </div>
            ))}

            {filteredAccounts.length === 0 ? (
              <div className="mt-12 text-center py-20 border border-dashed border-white/10 rounded-[40px]">
                <p className="text-white/30">No rewards accounts match the current search.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
