"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  id: string;
  title: string;
  department: string | null;
  opportunity_type: string;
  summary: string | null;
  description: string | null;
  requirements: string[] | null;
  perks: string[] | null;
  pay_label: string | null;
  status: string;
  is_public?: boolean;
  location_city?: string | null;
  location_state?: string | null;
  priority_score?: number;
  display_order?: number;
};

function parseList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OpportunitiesAdminClient() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    title: "",
    roleCode: "",
    department: "",
    opportunityType: "volunteer",
    summary: "",
    description: "",
    requirements: "",
    perks: "",
    payLabel: "",
    status: "open",
    isPublic: true,
    locationCity: "Baltimore",
    locationState: "MD",
    priorityScore: 100,
    displayOrder: 100,
    seasonSlug: "season-1",
  });

  async function load() {
    const res = await fetch("/api/epl/admin/opportunities", { cache: "no-store" });
    const json = (await res.json()) as { opportunities?: Opportunity[]; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not load opportunities.");
      return;
    }
    const next = json.opportunities || [];
    setOpportunities(next);
    if (!selectedId && next[0]?.id) setSelectedId(next[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.id === selectedId) || null,
    [opportunities, selectedId],
  );

  useEffect(() => {
    if (!selectedOpportunity) return;
    setForm({
      id: selectedOpportunity.id,
      seasonSlug: "season-1",
      title: selectedOpportunity.title || "",
      roleCode: (selectedOpportunity as any).role_code || "",
      department: selectedOpportunity.department || "",
      opportunityType: selectedOpportunity.opportunity_type || "volunteer",
      summary: selectedOpportunity.summary || "",
      description: selectedOpportunity.description || "",
      requirements: (selectedOpportunity.requirements || []).join("\n"),
      perks: (selectedOpportunity.perks || []).join("\n"),
      payLabel: selectedOpportunity.pay_label || "",
      status: selectedOpportunity.status || "open",
      isPublic: selectedOpportunity.is_public !== false,
      locationCity: selectedOpportunity.location_city || "",
      locationState: selectedOpportunity.location_state || "",
      priorityScore: selectedOpportunity.priority_score || 100,
      displayOrder: selectedOpportunity.display_order || 100,
    });
  }, [selectedOpportunity]);

  async function saveOpportunity(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requirements: parseList(form.requirements || ""),
        perks: parseList(form.perks || ""),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save opportunity.");
      return;
    }
    setMessage(form.id ? "Opportunity updated." : "Opportunity created.");
    if (!form.id) {
      setForm({
        title: "",
        roleCode: "",
        department: "",
        opportunityType: "volunteer",
        summary: "",
        description: "",
        requirements: "",
        perks: "",
        payLabel: "",
        status: "open",
        isPublic: true,
        locationCity: "Baltimore",
        locationState: "MD",
        priorityScore: 100,
        displayOrder: 100,
        seasonSlug: "season-1",
      });
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">EPL opportunities</div>
            <h1 className="ev-title">Control the live staffing and volunteer openings the public can actually apply for.</h1>
            <p className="ev-subtitle">
              Create paid and volunteer roles, decide what is public, order the listings, and keep the league hiring funnel aligned with current operational needs.
            </p>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Live roles</div>
          <div className="mt-4 space-y-3">
            {opportunities.map((opportunity) => (
              <button
                key={opportunity.id}
                type="button"
                onClick={() => setSelectedId(opportunity.id)}
                className={`w-full rounded-2xl border p-4 text-left ${
                  selectedId === opportunity.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                }`}
              >
                <div className="text-sm uppercase tracking-[0.18em] text-[#caa7ff]">{opportunity.opportunity_type}</div>
                <div className="mt-2 text-lg font-semibold text-white">{opportunity.title}</div>
                <div className="mt-2 text-sm text-white/55">
                  {opportunity.location_city || "Baltimore"} {opportunity.pay_label ? `• ${opportunity.pay_label}` : ""}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">{form.id ? "Edit role" : "Create role"}</div>
          <h2 className="mt-3 text-2xl font-bold text-white">{form.id ? "Update opportunity" : "Open a new opportunity"}</h2>
          <form onSubmit={saveOpportunity} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="Role title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="ev-field" placeholder="Role code" value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <select className="ev-field" value={form.opportunityType} onChange={(e) => setForm({ ...form, opportunityType: e.target.value })}>
                <option value="volunteer">Volunteer</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <input className="ev-field" placeholder="Short summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <textarea className="ev-textarea" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <textarea className="ev-textarea" rows={4} placeholder="Requirements, one per line" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
              <textarea className="ev-textarea" rows={4} placeholder="Perks, one per line" value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <input className="ev-field" placeholder="Pay label" value={form.payLabel} onChange={(e) => setForm({ ...form, payLabel: e.target.value })} />
              <input className="ev-field" placeholder="City" value={form.locationCity} onChange={(e) => setForm({ ...form, locationCity: e.target.value })} />
              <input className="ev-field" placeholder="State" value={form.locationState} onChange={(e) => setForm({ ...form, locationState: e.target.value })} />
              <select className="ev-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="filled">Filled</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input className="ev-field" type="number" placeholder="Priority" value={form.priorityScore} onChange={(e) => setForm({ ...form, priorityScore: Number(e.target.value || 100) })} />
              <input className="ev-field" type="number" placeholder="Display order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value || 100) })} />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                <input type="checkbox" checked={Boolean(form.isPublic)} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                Publicly visible
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="ev-button-primary">{form.id ? "Save opportunity" : "Create opportunity"}</button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setForm({
                      title: "",
                      roleCode: "",
                      department: "",
                      opportunityType: "volunteer",
                      summary: "",
                      description: "",
                      requirements: "",
                      perks: "",
                      payLabel: "",
                      status: "open",
                      isPublic: true,
                      locationCity: "Baltimore",
                      locationState: "MD",
                      priorityScore: 100,
                      displayOrder: 100,
                      seasonSlug: "season-1",
                    });
                  }}
                  className="ev-button-secondary"
                >
                  New opportunity
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
