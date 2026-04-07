"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [placementForm, setPlacementForm] = useState({
    id: "",
    sponsor_partner_id: "",
    sponsor_package_order_id: "",
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
    const [placementsRes, ordersRes, sponsorsRes, packagesRes] = await Promise.all([
      fetch("/api/admin/sponsor-placements", { cache: "no-store" }),
      fetch("/api/admin/sponsor-orders", { cache: "no-store" }),
      fetch("/api/epl/admin/sponsors?seasonSlug=season-1", { cache: "no-store" }),
      fetch("/api/epl/admin/sponsorship-packages", { cache: "no-store" }),
    ]);

    const placementsJson = (await placementsRes.json()) as { placements?: any[]; error?: string };
    const ordersJson = (await ordersRes.json()) as { orders?: any[]; error?: string };
    const sponsorsJson = (await sponsorsRes.json()) as { sponsors?: any[]; error?: string };
    const packagesJson = (await packagesRes.json()) as { packages?: any[]; error?: string };

    if (!placementsRes.ok) return setMessage(placementsJson.error || "Could not load sponsor placements.");
    if (!ordersRes.ok) return setMessage(ordersJson.error || "Could not load sponsor orders.");
    if (!sponsorsRes.ok) return setMessage(sponsorsJson.error || "Could not load sponsors.");
    if (!packagesRes.ok) return setMessage(packagesJson.error || "Could not load sponsorship packages.");

    setPlacements(placementsJson.placements || []);
    setOrders(ordersJson.orders || []);
    setSponsors(sponsorsJson.sponsors || []);
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
            <div className="ev-section-kicker">Placement control</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Create or update sponsor placements</h2>
            <form onSubmit={savePlacement} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
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
    </main>
  );
}
