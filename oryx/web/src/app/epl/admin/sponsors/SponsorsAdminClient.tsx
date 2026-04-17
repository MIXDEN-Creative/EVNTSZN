"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS } from "@/lib/city-options";
import { formatUsd } from "@/lib/money";

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SponsorsAdminClient() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [sponsorAccounts, setSponsorAccounts] = useState<any[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [accountForm, setAccountForm] = useState({
    id: "",
    name: "",
    slug: "",
    account_type: "sponsor",
    scope_type: "platform",
    city_scope: "",
    scope_reference: "",
    tier_label: "",
    status: "lead",
    logo_url: "",
    website_url: "",
    cta_label: "Learn more",
    is_featured: false,
    relationship_owner_user_id: "",
    starts_at: "",
    ends_at: "",
    activation_status: "prospect",
    fulfillment_status: "not_started",
    asset_ready: false,
    epl_category: "",
    notes: "",
  });
  const [placementForm, setPlacementForm] = useState({
    id: "",
    sponsor_partner_id: "",
    sponsor_package_order_id: "",
    sponsor_account_id: "",
    name: "",
    type: "sponsor",
    logo_url: "",
    website_url: "",
    cta_label: "Learn more",
    status: "draft",
    visibility_locations: "homepage, epl",
    display_order: 100,
    is_featured: false,
    starts_at: "",
    ends_at: "",
    notes: "",
  });

  async function load() {
    const [placementsRes, ordersRes, sponsorsRes, packagesRes, sponsorAccountsRes, usersRes] = await Promise.all([
      fetch("/api/admin/sponsor-placements", { cache: "no-store" }),
      fetch("/api/admin/sponsor-orders", { cache: "no-store" }),
      fetch("/api/epl/admin/sponsors?seasonSlug=season-1", { cache: "no-store" }),
      fetch("/api/epl/admin/sponsorship-packages", { cache: "no-store" }),
      fetch("/api/admin/sponsor-accounts", { cache: "no-store" }),
      fetch("/api/admin/operator-users", { cache: "no-store" }),
    ]);

    const placementsJson = (await placementsRes.json()) as { placements?: any[]; error?: string };
    const ordersJson = (await ordersRes.json()) as { orders?: any[]; error?: string };
    const sponsorsJson = (await sponsorsRes.json()) as { sponsors?: any[]; error?: string };
    const packagesJson = (await packagesRes.json()) as { packages?: any[]; error?: string };
    const sponsorAccountsJson = (await sponsorAccountsRes.json()) as { sponsorAccounts?: any[]; error?: string };
    const usersJson = (await usersRes.json()) as { users?: any[]; error?: string };

    if (!placementsRes.ok) return setMessage(placementsJson.error || "Could not load sponsor placements.");
    if (!ordersRes.ok) return setMessage(ordersJson.error || "Could not load sponsor orders.");
    if (!sponsorsRes.ok) return setMessage(sponsorsJson.error || "Could not load sponsors.");
    if (!packagesRes.ok) return setMessage(packagesJson.error || "Could not load sponsorship packages.");
    if (!sponsorAccountsRes.ok) return setMessage(sponsorAccountsJson.error || "Could not load sponsor accounts.");
    if (!usersRes.ok) return setMessage(usersJson.error || "Could not load sponsor relationship owners.");

    setPlacements(placementsJson.placements || []);
    setOrders(ordersJson.orders || []);
    setSponsors(sponsorsJson.sponsors || []);
    setSponsorAccounts(sponsorAccountsJson.sponsorAccounts || []);
    setOperatorUsers(usersJson.users || []);
    setPackages(packagesJson.packages || []);
    if (!selectedOrderId && ordersJson.orders?.[0]?.id) setSelectedOrderId(ordersJson.orders[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );
  const sponsorSummary = useMemo(
    () => ({
      prospects: sponsorAccounts.filter((account) => account.activation_status === "prospect").length,
      active: sponsorAccounts.filter((account) => account.activation_status === "active").length,
      eplScoped: sponsorAccounts.filter((account) => account.scope_type === "epl" || Boolean(account.epl_category)).length,
      readyForPlacement: sponsorAccounts.filter((account) => account.asset_ready || account.fulfillment_status === "ready" || account.fulfillment_status === "live").length,
    }),
    [sponsorAccounts],
  );

  async function saveSponsorAccount(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/sponsor-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...accountForm,
        city_scope: parseList(accountForm.city_scope),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save sponsor account.");
      return;
    }
    setMessage(accountForm.id ? "Sponsor account updated." : "Sponsor account created.");
    setAccountForm({
      id: "",
      name: "",
      slug: "",
      account_type: "sponsor",
      scope_type: "platform",
      city_scope: "",
      scope_reference: "",
      tier_label: "",
      status: "lead",
      logo_url: "",
      website_url: "",
      cta_label: "Learn more",
      is_featured: false,
      relationship_owner_user_id: "",
      starts_at: "",
      ends_at: "",
      activation_status: "prospect",
      fulfillment_status: "not_started",
      asset_ready: false,
      epl_category: "",
      notes: "",
    });
    await load();
  }

  async function savePlacement(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/sponsor-placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...placementForm,
        visibility_locations: parseList(placementForm.visibility_locations),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save sponsor placement.");
      return;
    }
    setMessage(placementForm.id ? "Sponsor placement updated." : "Sponsor placement created.");
    setPlacementForm({
      id: "",
      sponsor_partner_id: "",
      sponsor_package_order_id: "",
      sponsor_account_id: "",
      name: "",
      type: "sponsor",
      logo_url: "",
      website_url: "",
      cta_label: "Learn more",
      status: "draft",
      visibility_locations: "homepage, epl",
      display_order: 100,
      is_featured: false,
      starts_at: "",
      ends_at: "",
      notes: "",
    });
    await load();
  }

  async function updateOrder(payload: Record<string, unknown>) {
    if (!selectedOrder) return;
    const res = await fetch("/api/admin/sponsor-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedOrder.id, ...payload }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update sponsor order.");
      return;
    }
    setMessage("Sponsor order updated.");
    await load();
  }

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Sponsors & partners</div>
            <h1 className="ev-title">Manage package orders, sponsor readiness, and public placements from one sponsor desk.</h1>
            <p className="ev-subtitle">
              Track package purchases, move sponsors from lead to live placement, and decide exactly where their logos and links appear across EVNTSZN and EPL.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Prospects", sponsorSummary.prospects],
              ["Active", sponsorSummary.active],
              ["EPL Scoped", sponsorSummary.eplScoped],
              ["Ready", sponsorSummary.readyForPlacement],
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
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-10">
          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Sponsor Editor</div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Account Configuration</h2>
            
            <form onSubmit={saveSponsorAccount} className="mt-10 grid gap-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Entity Name</label>
                  <input className="ev-field" placeholder="Sponsor or partner name" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Slug</label>
                  <input className="ev-field" placeholder="sponsor-slug" value={accountForm.slug} onChange={(e) => setAccountForm({ ...accountForm, slug: e.target.value })} required />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Account Type</label>
                  <select className="ev-field" value={accountForm.account_type} onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}>
                    <option value="sponsor">Sponsor</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Scope</label>
                  <select className="ev-field" value={accountForm.scope_type} onChange={(e) => setAccountForm({ ...accountForm, scope_type: e.target.value })}>
                    {["platform", "epl", "city", "event", "venue"].map((scope) => (
                      <option key={scope} value={scope}>{scope}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Relationship Status</label>
                  <select className="ev-field" value={accountForm.status} onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value })}>
                    {["lead", "pending", "active", "archived"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Tier / Package Label</label>
                  <input className="ev-field" placeholder="e.g. Gold Partner" value={accountForm.tier_label} onChange={(e) => setAccountForm({ ...accountForm, tier_label: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">City Scope (Comma separated)</label>
                  <input className="ev-field" list="sponsor-city-scope-options" placeholder="Baltimore, DC..." value={accountForm.city_scope} onChange={(e) => setAccountForm({ ...accountForm, city_scope: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Relationship Owner</label>
                  <select className="ev-field" value={accountForm.relationship_owner_user_id} onChange={(e) => setAccountForm({ ...accountForm, relationship_owner_user_id: e.target.value })}>
                    <option value="">Choose manager...</option>
                    {operatorUsers.map((user) => (
                      <option key={user.user_id} value={user.user_id}>{user.full_name || user.user_id}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">EPL Category</label>
                  <select className="ev-field" value={accountForm.epl_category} onChange={(e) => setAccountForm({ ...accountForm, epl_category: e.target.value })}>
                    <option value="">None</option>
                    <option value="league_partner">League partner</option>
                    <option value="presenting_partner">Presenting partner</option>
                    <option value="game_day_partner">Game-day partner</option>
                    <option value="community_partner">Community partner</option>
                    <option value="apparel_equipment_partner">Apparel partner</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Activation</label>
                  <select className="ev-field" value={accountForm.activation_status} onChange={(e) => setAccountForm({ ...accountForm, activation_status: e.target.value })}>
                    {["prospect", "contracting", "active", "paused", "ended"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Fulfillment</label>
                  <select className="ev-field" value={accountForm.fulfillment_status} onChange={(e) => setAccountForm({ ...accountForm, fulfillment_status: e.target.value })}>
                    {["not_started", "collecting_assets", "ready", "live", "fulfilled"].map((status) => (
                      <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70 hover:bg-white/5 transition cursor-pointer">
                  <input type="checkbox" className="rounded bg-black border-white/20" checked={accountForm.is_featured} onChange={(e) => setAccountForm({ ...accountForm, is_featured: e.target.checked })} />
                  <span>Featured Account</span>
                </label>
                <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70 hover:bg-white/5 transition cursor-pointer">
                  <input type="checkbox" className="rounded bg-black border-white/20" checked={accountForm.asset_ready} onChange={(e) => setAccountForm({ ...accountForm, asset_ready: e.target.checked })} />
                  <span>Assets Ready</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
                <button type="submit" className="ev-button-primary px-10 py-4">{accountForm.id ? "Save Account" : "Create Account"}</button>
                {accountForm.id && (
                  <button type="button" className="ev-button-secondary py-4" onClick={() => setAccountForm({
                    id: "", name: "", slug: "", account_type: "sponsor", scope_type: "platform", city_scope: "", scope_reference: "", tier_label: "", status: "lead", logo_url: "", website_url: "", cta_label: "Learn more", is_featured: false, relationship_owner_user_id: "", starts_at: "", ends_at: "", activation_status: "prospect", fulfillment_status: "not_started", asset_ready: false, epl_category: "", notes: "",
                  })}>Discard Changes</button>
                )}
              </div>
            </form>
          </section>

          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Placement Desk</div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Active Placements</h2>
            
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {placements.map((placement) => (
                <button
                  key={placement.id}
                  type="button"
                  onClick={() => setPlacementForm({
                    id: placement.id,
                    sponsor_partner_id: placement.sponsor_partner_id || "",
                    sponsor_package_order_id: placement.sponsor_package_order_id || "",
                    sponsor_account_id: placement.sponsor_account_id || "",
                    name: placement.name || "",
                    type: placement.type || "sponsor",
                    logo_url: placement.logo_url || "",
                    website_url: placement.website_url || "",
                    cta_label: placement.cta_label || "",
                    status: placement.status || "draft",
                    visibility_locations: Array.isArray(placement.visibility_locations) ? placement.visibility_locations.join(", ") : "",
                    display_order: placement.display_order || 100,
                    is_featured: Boolean(placement.is_featured),
                    starts_at: placement.starts_at ? String(placement.starts_at).slice(0, 16) : "",
                    ends_at: placement.ends_at ? String(placement.ends_at).slice(0, 16) : "",
                    notes: placement.notes || "",
                  })}
                  className="rounded-[32px] border border-white/10 bg-black/30 p-6 text-left transition hover:bg-white/[0.03] hover:border-white/20 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#caa7ff]">{placement.type} · {placement.status}</div>
                    {placement.is_featured && <span className="rounded-full bg-[#caa7ff]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#caa7ff]">Featured</span>}
                  </div>
                  <div className="mt-3 text-lg font-bold text-white group-hover:text-[#caa7ff] transition-colors">{placement.name}</div>
                  <div className="mt-2 text-xs text-white/40 line-clamp-1">
                    {Array.isArray(placement.visibility_locations) ? placement.visibility_locations.join(", ") : "No locations"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-10">
          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Relationship Roster</div>
            <div className="mt-6 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {sponsorAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setAccountForm({
                    id: account.id,
                    name: account.name || "",
                    slug: account.slug || "",
                    account_type: account.account_type || "sponsor",
                    scope_type: account.scope_type || "platform",
                    city_scope: Array.isArray(account.city_scope) ? account.city_scope.join(", ") : "",
                    scope_reference: account.scope_reference || "",
                    tier_label: account.tier_label || "",
                    status: account.status || "lead",
                    logo_url: account.logo_url || "",
                    website_url: account.website_url || "",
                    cta_label: account.cta_label || "Learn more",
                    is_featured: Boolean(account.is_featured),
                    relationship_owner_user_id: account.relationship_owner_user_id || "",
                    starts_at: account.starts_at ? String(account.starts_at).slice(0, 16) : "",
                    ends_at: account.ends_at ? String(account.ends_at).slice(0, 16) : "",
                    activation_status: account.activation_status || "prospect",
                    fulfillment_status: account.fulfillment_status || "not_started",
                    asset_ready: Boolean(account.asset_ready),
                    epl_category: account.epl_category || "",
                    notes: account.notes || "",
                  })}
                  className={`w-full rounded-[28px] border p-6 text-left transition ${
                    accountForm.id === account.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-[#caa7ff] font-bold">
                    <span>{account.status}</span>
                    <span className="text-white/20">/</span>
                    <span>{String(account.activation_status || "prospect").replace(/_/g, " ")}</span>
                  </div>
                  <div className="mt-3 text-xl font-bold text-white">{account.name}</div>
                  <div className="mt-2 text-sm text-white/40">{account.tier_label || "No tier set"}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Package Demand</div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-3xl border border-white/5 bg-black/40 p-6 transition hover:bg-black/60">
                  <div className="text-sm font-bold text-white">{pkg.package_name}</div>
                  <div className="mt-2 text-lg font-black text-[#caa7ff]">{formatUsd(pkg.cash_price_usd)}</div>
                </div>
              ))}
            </div>
          </section>

          {selectedOrder && (
            <section className="ev-panel p-8 bg-[#caa7ff]/5 border-[#caa7ff]/20">
              <div className="ev-section-kicker !text-[#caa7ff]">Order Detail</div>
              <h2 className="mt-3 text-2xl font-black text-white">{selectedOrder.company_name}</h2>
              <div className="mt-6 grid gap-4 text-sm text-white/60">
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Package</span><span className="text-white font-bold">{selectedOrder.package_name || "—"}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Contact</span><span className="text-white font-bold">{selectedOrder.contact_name || "—"}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-2"><span>Status</span><span className="text-[#caa7ff] font-black uppercase tracking-widest">{selectedOrder.status}</span></div>
              </div>
              <div className="mt-8 grid gap-3">
                <select className="ev-field bg-black/40" value={selectedOrder.status} onChange={(e) => updateOrder({ status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                </select>
                <textarea className="ev-textarea bg-black/40" rows={4} placeholder="Internal order notes" defaultValue={selectedOrder.notes || ""} onBlur={(e) => updateOrder({ notes: e.target.value })} />
              </div>
            </section>
          )}
        </div>
      </div>

      <datalist id="sponsor-city-scope-options">
        {INTERNAL_CITY_OPTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </main>
  );
}
