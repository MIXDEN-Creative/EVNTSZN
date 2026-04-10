"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS } from "@/lib/city-options";

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
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Sponsors & partners</div>
            <h1 className="ev-title">Manage package orders, sponsor readiness, and public placements from one sponsor desk.</h1>
            <p className="ev-subtitle">
              Track package purchases, move sponsors from lead to live placement, and decide exactly where their logos and links appear across EVNTSZN and EPL.
            </p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Sponsor accounts</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Track platform, EPL, city, and partner relationships</h2>
            <form onSubmit={saveSponsorAccount} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" placeholder="Sponsor or partner name" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
                <input className="ev-field" placeholder="Slug" value={accountForm.slug} onChange={(e) => setAccountForm({ ...accountForm, slug: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <select className="ev-field" value={accountForm.account_type} onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}>
                  <option value="sponsor">Sponsor</option>
                  <option value="partner">Partner</option>
                </select>
                <select className="ev-field" value={accountForm.scope_type} onChange={(e) => setAccountForm({ ...accountForm, scope_type: e.target.value })}>
                  {["platform", "epl", "city", "event", "venue"].map((scope) => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </select>
                <select className="ev-field" value={accountForm.status} onChange={(e) => setAccountForm({ ...accountForm, status: e.target.value })}>
                  {["lead", "pending", "active", "archived"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" placeholder="Tier or package label" value={accountForm.tier_label} onChange={(e) => setAccountForm({ ...accountForm, tier_label: e.target.value })} />
                <input className="ev-field" list="sponsor-city-scope-options" placeholder="City scope (comma separated)" value={accountForm.city_scope} onChange={(e) => setAccountForm({ ...accountForm, city_scope: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="ev-field" value={accountForm.relationship_owner_user_id} onChange={(e) => setAccountForm({ ...accountForm, relationship_owner_user_id: e.target.value })}>
                  <option value="">Relationship owner / manager</option>
                  {operatorUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name || user.user_id}
                    </option>
                  ))}
                </select>
                <select className="ev-field" value={accountForm.epl_category} onChange={(e) => setAccountForm({ ...accountForm, epl_category: e.target.value })}>
                  <option value="">No EPL sponsor category</option>
                  <option value="league_partner">League partner</option>
                  <option value="presenting_partner">Presenting partner</option>
                  <option value="game_day_partner">Game-day partner</option>
                  <option value="community_partner">Community partner</option>
                  <option value="apparel_equipment_partner">Apparel / equipment partner</option>
                </select>
              </div>
              <input className="ev-field" placeholder="Scope reference (event slug, venue id, internal tag)" value={accountForm.scope_reference} onChange={(e) => setAccountForm({ ...accountForm, scope_reference: e.target.value })} />
              <input className="ev-field" placeholder="Logo URL" value={accountForm.logo_url} onChange={(e) => setAccountForm({ ...accountForm, logo_url: e.target.value })} />
              <input className="ev-field" placeholder="Website URL" value={accountForm.website_url} onChange={(e) => setAccountForm({ ...accountForm, website_url: e.target.value })} />
              <input className="ev-field" placeholder="CTA label" value={accountForm.cta_label} onChange={(e) => setAccountForm({ ...accountForm, cta_label: e.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" type="datetime-local" value={accountForm.starts_at} onChange={(e) => setAccountForm({ ...accountForm, starts_at: e.target.value })} />
                <input className="ev-field" type="datetime-local" value={accountForm.ends_at} onChange={(e) => setAccountForm({ ...accountForm, ends_at: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="ev-field" value={accountForm.activation_status} onChange={(e) => setAccountForm({ ...accountForm, activation_status: e.target.value })}>
                  {["prospect", "contracting", "active", "paused", "ended"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select className="ev-field" value={accountForm.fulfillment_status} onChange={(e) => setAccountForm({ ...accountForm, fulfillment_status: e.target.value })}>
                  {["not_started", "collecting_assets", "ready", "live", "fulfilled"].map((status) => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                <input type="checkbox" checked={accountForm.is_featured} onChange={(e) => setAccountForm({ ...accountForm, is_featured: e.target.checked })} />
                Featured account
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                <input type="checkbox" checked={accountForm.asset_ready} onChange={(e) => setAccountForm({ ...accountForm, asset_ready: e.target.checked })} />
                Assets ready for placement
              </label>
              <textarea className="ev-textarea" rows={3} placeholder="Internal notes" value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="ev-button-primary">{accountForm.id ? "Save sponsor account" : "Create sponsor account"}</button>
                {accountForm.id ? (
                  <button type="button" className="ev-button-secondary" onClick={() => setAccountForm({
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
                  })}>
                    New sponsor account
                  </button>
                ) : null}
              </div>
            </form>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Prospects", sponsorSummary.prospects],
                ["Active", sponsorSummary.active],
                ["EPL scoped", sponsorSummary.eplScoped],
                ["Placement ready", sponsorSummary.readyForPlacement],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                  <div className="mt-3 text-2xl font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Sponsor relationship roster</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {sponsorAccounts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                  No sponsor or partner accounts have been added yet. Create the relationship here before pushing logos into public placements.
                </div>
              ) : (
                sponsorAccounts.map((account) => (
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
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                      <span>{account.account_type}</span>
                      <span>{account.scope_type}</span>
                      <span>{account.status}</span>
                      <span>{String(account.activation_status || "prospect").replace(/_/g, " ")}</span>
                      {account.epl_category ? <span>{String(account.epl_category).replace(/_/g, " ")}</span> : null}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{account.name}</div>
                    <div className="mt-2 text-sm text-white/55">
                      {account.tier_label || "No tier set"}{account.city_scope?.length ? ` · ${account.city_scope.join(", ")}` : ""}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {account.asset_ready ? <span className="ev-chip ev-chip--external">Assets ready</span> : null}
                      {account.fulfillment_status ? (
                        <span className="ev-chip ev-chip--external">{String(account.fulfillment_status).replace(/_/g, " ")}</span>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Placement control</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Create or update sponsor placements</h2>
            <form onSubmit={savePlacement} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <select className="ev-field" value={placementForm.sponsor_account_id} onChange={(e) => setPlacementForm({ ...placementForm, sponsor_account_id: e.target.value })}>
                  <option value="">Link sponsor account</option>
                  {sponsorAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name} · {account.scope_type}</option>
                  ))}
                </select>
                <select className="ev-field" value={placementForm.sponsor_partner_id} onChange={(e) => setPlacementForm({ ...placementForm, sponsor_partner_id: e.target.value })}>
                  <option value="">Link sponsor record</option>
                  {sponsors.map((sponsor) => (
                    <option key={sponsor.id} value={sponsor.id}>{sponsor.company_name}</option>
                  ))}
                </select>
                <select className="ev-field" value={placementForm.sponsor_package_order_id} onChange={(e) => setPlacementForm({ ...placementForm, sponsor_package_order_id: e.target.value })}>
                  <option value="">Link package order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>{order.company_name} · {order.package_name || "Package"}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" placeholder="Placement name" value={placementForm.name} onChange={(e) => setPlacementForm({ ...placementForm, name: e.target.value })} />
                <select className="ev-field" value={placementForm.type} onChange={(e) => setPlacementForm({ ...placementForm, type: e.target.value })}>
                  <option value="sponsor">Sponsor</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <input className="ev-field" placeholder="Logo URL" value={placementForm.logo_url} onChange={(e) => setPlacementForm({ ...placementForm, logo_url: e.target.value })} />
              <input className="ev-field" placeholder="Destination URL" value={placementForm.website_url} onChange={(e) => setPlacementForm({ ...placementForm, website_url: e.target.value })} />
              <div className="grid gap-4 md:grid-cols-4">
                <input className="ev-field" placeholder="CTA label" value={placementForm.cta_label} onChange={(e) => setPlacementForm({ ...placementForm, cta_label: e.target.value })} />
                <select className="ev-field" value={placementForm.status} onChange={(e) => setPlacementForm({ ...placementForm, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="live">Live</option>
                  <option value="inactive">Inactive</option>
                </select>
                <input className="ev-field" type="number" placeholder="Display order" value={placementForm.display_order} onChange={(e) => setPlacementForm({ ...placementForm, display_order: Number(e.target.value || 100) })} />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                  <input type="checkbox" checked={placementForm.is_featured} onChange={(e) => setPlacementForm({ ...placementForm, is_featured: e.target.checked })} />
                  Featured
                </label>
              </div>
              <textarea className="ev-textarea" rows={2} placeholder="Visibility locations (homepage, footer, epl, city:baltimore...)" value={placementForm.visibility_locations} onChange={(e) => setPlacementForm({ ...placementForm, visibility_locations: e.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" type="datetime-local" value={placementForm.starts_at} onChange={(e) => setPlacementForm({ ...placementForm, starts_at: e.target.value })} />
                <input className="ev-field" type="datetime-local" value={placementForm.ends_at} onChange={(e) => setPlacementForm({ ...placementForm, ends_at: e.target.value })} />
              </div>
              <textarea className="ev-textarea" rows={3} placeholder="Internal placement notes" value={placementForm.notes} onChange={(e) => setPlacementForm({ ...placementForm, notes: e.target.value })} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="ev-button-primary">{placementForm.id ? "Save placement" : "Create placement"}</button>
                {placementForm.id ? (
                  <button type="button" className="ev-button-secondary" onClick={() => setPlacementForm({
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
                  })}>
                    New placement
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Placement roster</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{placement.type} · {placement.status}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{placement.name}</div>
                    </div>
                    {placement.is_featured ? <span className="ev-chip ev-chip--external">Featured</span> : null}
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    {Array.isArray(placement.visibility_locations) ? placement.visibility_locations.join(", ") : "No locations assigned"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Package demand</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-lg font-semibold text-white">{pkg.package_name}</div>
                  <div className="mt-2 text-sm text-white/55">${((pkg.cash_price_cents || 0) / 100).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Orders</div>
            <div className="mt-5 space-y-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    order.id === selectedOrderId ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{order.status} · {order.order_type}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{order.company_name}</div>
                  <div className="mt-1 text-sm text-white/55">{order.package_name || "Package pending"} · ${((order.amount_cents || 0) / 100).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </section>

          {selectedOrder ? (
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Order detail</div>
              <h2 className="mt-3 text-2xl font-bold text-white">{selectedOrder.company_name}</h2>
              <div className="mt-4 space-y-2 text-sm leading-7 text-white/72">
                <div>Package: {selectedOrder.package_name || "Not set"}</div>
                <div>Contact: {selectedOrder.contact_name || "Not set"} · {selectedOrder.contact_email}</div>
                <div>Phone: {selectedOrder.contact_phone || "Not set"}</div>
                <div>Status: {selectedOrder.status}</div>
                <div>Order type: {selectedOrder.order_type}</div>
                <div>Stripe checkout session: {selectedOrder.stripe_checkout_session_id || "Not attached"}</div>
                <div>Stripe payment intent: {selectedOrder.stripe_payment_intent_id || "Not attached"}</div>
                <div>Sponsor linked: {selectedOrder.sponsor_partner_id ? "Yes" : "No"}</div>
              </div>
              <div className="mt-5 grid gap-4">
                <a href={`/epl/admin/sponsors/orders/${selectedOrder.id}`} className="ev-button-secondary text-center">
                  Open order detail page
                </a>
                <select className="ev-field" value={selectedOrder.status} onChange={(e) => updateOrder({ status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                  <option value="inquiry">Inquiry</option>
                </select>
                <textarea
                  className="ev-textarea"
                  rows={4}
                  defaultValue={selectedOrder.notes || ""}
                  placeholder="Internal order notes"
                  onBlur={(e) => updateOrder({ notes: e.target.value })}
                />
              </div>
            </section>
          ) : null}
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
