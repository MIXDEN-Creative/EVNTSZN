"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  seasonSlug: string;
};

type TabKey =
  | "overview"
  | "people"
  | "revenue"
  | "hiring";

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-white/55">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function LeagueOfficeAdmin({ seasonSlug }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [playerPipeline, setPlayerPipeline] = useState<any[]>([]);
  const [staffApplications, setStaffApplications] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [assignmentForm, setAssignmentForm] = useState({
    staffApplicationId: "",
    roleId: "",
    assignmentStatus: "assigned",
    compensationTier: "volunteer",
    payRateUsd: "",
    stipendUsd: "",
    canAccessAdmin: false,
    canAccessDraftConsole: false,
    canAccessScanner: false,
    canAccessFinance: false,
  });

  const [revenueForm, setRevenueForm] = useState({
    streamCode: "ticketing",
    moneyDirection: "in",
    amountUsd: "",
    memo: "",
    entryStatus: "posted",
  });

  const [opportunityForm, setOpportunityForm] = useState({
    roleCode: "",
    title: "",
    department: "",
    opportunityType: "volunteer",
    summary: "",
    description: "",
    requirements: "",
    perks: "",
    payLabel: "",
    status: "open",
    isPublic: true,
    displayOrder: "100",
  });

  const [sponsorForm, setSponsorForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    packageName: "",
    partnerStatus: "lead",
    cashValueUsd: "",
    inKindValueUsd: "",
    notes: "",
  });

  const [merchForm, setMerchForm] = useState({
    sku: "",
    itemName: "",
    itemType: "apparel",
    priceUsd: "",
    costUsd: "",
    inventoryCount: "",
    isActive: true,
  });

  const [addOnForm, setAddOnForm] = useState({
    code: "",
    itemName: "",
    description: "",
    priceUsd: "",
    fulfillmentType: "digital",
    isActive: true,
  });

  async function load() {
    setMessage("");

    const [
      playerRes,
      staffAppRes,
      staffAssignRes,
      revenueRes,
      oppRes,
      sponsorRes,
      merchRes,
      addOnRes,
    ] = await Promise.all([
      fetch(`/api/epl/admin/operations-player-pipeline?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/staff-applications?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/staff-assignments?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/revenue-ledger?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/opportunities`),
      fetch(`/api/epl/admin/sponsors?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/merch?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/add-ons?seasonSlug=${seasonSlug}`),
    ]);

    const playerJson = (await playerRes.json()) as Record<string, any>;
    const staffAppJson = (await staffAppRes.json()) as Record<string, any>;
    const staffAssignJson = (await staffAssignRes.json()) as Record<string, any>;
    const revenueJson = (await revenueRes.json()) as Record<string, any>;
    const oppJson = (await oppRes.json()) as Record<string, any>;
    const sponsorJson = (await sponsorRes.json()) as Record<string, any>;
    const merchJson = (await merchRes.json()) as Record<string, any>;
    const addOnJson = (await addOnRes.json()) as Record<string, any>;

    setPlayerPipeline(playerJson.entries || []);
    setStaffApplications(staffAppJson.applications || []);
    setStaffAssignments(staffAssignJson.assignments || []);
    setRoles(staffAssignJson.roles || []);
    setRevenueEntries(revenueJson.entries || []);
    setOpportunities(oppJson.opportunities || []);
    setSponsors(sponsorJson.sponsors || []);
    setMerch(merchJson.merch || []);
    setAddOns(addOnJson.addOns || []);
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  const totals = useMemo(() => {
    const moneyIn = revenueEntries
      .filter((r) => r.money_direction === "in")
      .reduce((sum, r) => sum + (r.amount_usd || 0), 0);

    const moneyOut = revenueEntries
      .filter((r) => r.money_direction === "out")
      .reduce((sum, r) => sum + (r.amount_usd || 0), 0);

    return {
      players: playerPipeline.length,
      staffApps: staffApplications.length,
      assignments: staffAssignments.length,
      opportunities: opportunities.length,
      sponsors: sponsors.length,
      merch: merch.length,
      addOns: addOns.length,
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
    };
  }, [playerPipeline, staffApplications, staffAssignments, opportunities, sponsors, merch, addOns, revenueEntries]);

  async function updateStaffApplication(id: string, status: string) {
    const res = await fetch("/api/epl/admin/staff-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not update staff application.");
      return;
    }

    setMessage("Staff application updated.");
    await load();
  }

  async function saveAssignment() {
    const res = await fetch("/api/epl/admin/staff-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonSlug, ...assignmentForm }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save staff assignment.");
      return;
    }

    setMessage("Staff assignment saved.");
    setAssignmentForm({
      staffApplicationId: "",
      roleId: "",
      assignmentStatus: "assigned",
      compensationTier: "volunteer",
      payRateUsd: "",
      stipendUsd: "",
      canAccessAdmin: false,
      canAccessDraftConsole: false,
      canAccessScanner: false,
      canAccessFinance: false,
    });
    await load();
  }

  async function saveRevenue() {
    const res = await fetch("/api/epl/admin/revenue-ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonSlug, ...revenueForm }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save revenue entry.");
      return;
    }

    setMessage("Revenue entry saved.");
    setRevenueForm({
      streamCode: "ticketing",
      moneyDirection: "in",
      amountUsd: "",
      memo: "",
      entryStatus: "posted",
    });
    await load();
  }

  async function saveOpportunity() {
    const res = await fetch("/api/epl/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonSlug,
        ...opportunityForm,
        requirements: opportunityForm.requirements.split(",").map(v => v.trim()).filter(Boolean),
        perks: opportunityForm.perks.split(",").map(v => v.trim()).filter(Boolean),
      }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save opportunity.");
      return;
    }

    setMessage("Opportunity saved.");
    setOpportunityForm({
      roleCode: "",
      title: "",
      department: "",
      opportunityType: "volunteer",
      summary: "",
      description: "",
      requirements: "",
      perks: "",
      payLabel: "",
      status: "open",
      isPublic: true,
      displayOrder: "100",
    });
    await load();
  }

  async function saveSponsor() {
    const res = await fetch("/api/epl/admin/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonSlug, ...sponsorForm }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save sponsor.");
      return;
    }

    setMessage("Sponsor saved.");
    setSponsorForm({
      companyName: "",
      contactName: "",
      contactEmail: "",
      packageName: "",
      partnerStatus: "lead",
      cashValueUsd: "",
      inKindValueUsd: "",
      notes: "",
    });
    await load();
  }

  async function saveMerch() {
    const res = await fetch("/api/epl/admin/merch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonSlug, ...merchForm }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save merch item.");
      return;
    }

    setMessage("Merch item saved.");
    setMerchForm({
      sku: "",
      itemName: "",
      itemType: "apparel",
      priceUsd: "",
      costUsd: "",
      inventoryCount: "",
      isActive: true,
    });
    await load();
  }

  async function saveAddOn() {
    const res = await fetch("/api/epl/admin/add-ons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonSlug, ...addOnForm }),
    });

    const json = (await res.json()) as Record<string, any>;
    if (!res.ok) {
      setMessage(json.error || "Could not save add-on.");
      return;
    }

    setMessage("Add-on saved.");
    setAddOnForm({
      code: "",
      itemName: "",
      description: "",
      priceUsd: "",
      fulfillmentType: "digital",
      isActive: true,
    });
    await load();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Operations</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">League Office Dashboard</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              Real operating system for league management, staffing, hiring, revenue, sponsors, merch, and add-ons.
            </p>
            {message ? <p className="mt-3 text-sm text-white/80">{message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview"],
              ["people", "People"],
              ["revenue", "Revenue"],
              ["hiring", "Hiring"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabKey)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  activeTab === key
                    ? "bg-[#A259FF] text-white"
                    : "border border-white/10 bg-white/[0.04] text-white/75"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Players In Pipeline" value={totals.players} />
              <StatCard label="Staff Applications" value={totals.staffApps} />
              <StatCard label="Assignments" value={totals.assignments} />
              <StatCard label="Open Opportunities" value={totals.opportunities} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Sponsors" value={totals.sponsors} />
              <StatCard label="Merch Items" value={totals.merch} />
              <StatCard label="Add-Ons" value={totals.addOns} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Money In" value={`$${Number(totals.moneyIn || 0).toFixed(2)}`} />
              <StatCard label="Money Out" value={`$${Number(totals.moneyOut || 0).toFixed(2)}`} />
              <StatCard label="Net" value={`$${Number(totals.net || 0).toFixed(2)}`} />
            </div>
          </>
        ) : null}

        {activeTab === "people" ? (
          <>
            <SectionCard title="Player Pipeline" subtitle="See which players are moving through league intake and draft prep.">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-white/[0.04]">
                    <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-4 py-4">Player</th>
                      <th className="px-4 py-4">Application</th>
                      <th className="px-4 py-4">Registration</th>
                      <th className="px-4 py-4">Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30">
                    {playerPipeline.map((row: any) => (
                      <tr key={row.application_id}>
                        <td className="px-4 py-4">{row.player_name}</td>
                        <td className="px-4 py-4 text-white/70">{row.application_status}</td>
                        <td className="px-4 py-4 text-white/70">{row.registration_status || "—"}</td>
                        <td className="px-4 py-4 text-white/70">{row.pipeline_stage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Staff Application Actions" subtitle="Review and move people through the staffing pipeline.">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-white/[0.04]">
                    <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-4 py-4">Applicant</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Preferred Roles</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30">
                    {staffApplications.map((row: any) => (
                      <tr key={row.staff_application_id}>
                        <td className="px-4 py-4">{row.applicant_name}</td>
                        <td className="px-4 py-4 text-white/70">{row.application_status}</td>
                        <td className="px-4 py-4 text-white/70">{(row.preferred_roles || []).join(", ") || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => updateStaffApplication(row.staff_application_id, "reviewing")} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Reviewing</button>
                            <button onClick={() => updateStaffApplication(row.staff_application_id, "approved")} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Approve</button>
                            <button onClick={() => updateStaffApplication(row.staff_application_id, "declined")} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">Decline</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Create Staff Assignment" subtitle="Assign approved people into actual league roles and access levels.">
              <div className="grid gap-4 md:grid-cols-4">
                <input value={assignmentForm.staffApplicationId} onChange={(e) => setAssignmentForm({ ...assignmentForm, staffApplicationId: e.target.value })} placeholder="Staff Application ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <select value={assignmentForm.roleId} onChange={(e) => setAssignmentForm({ ...assignmentForm, roleId: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                  <option value="">Select role</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
                <select value={assignmentForm.assignmentStatus} onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentStatus: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                  <option value="assigned">Assigned</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={assignmentForm.compensationTier} onChange={(e) => setAssignmentForm({ ...assignmentForm, compensationTier: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                  <option value="paid">Paid</option>
                  <option value="incentivized">Incentivized</option>
                  <option value="volunteer">Volunteer</option>
                </select>
                <input value={assignmentForm.payRateUsd} onChange={(e) => setAssignmentForm({ ...assignmentForm, payRateUsd: e.target.value })} placeholder="Pay Rate USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={assignmentForm.stipendUsd} onChange={(e) => setAssignmentForm({ ...assignmentForm, stipendUsd: e.target.value })} placeholder="Stipend USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={assignmentForm.canAccessAdmin} onChange={(e) => setAssignmentForm({ ...assignmentForm, canAccessAdmin: e.target.checked })} /> Admin</label>
                <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={assignmentForm.canAccessDraftConsole} onChange={(e) => setAssignmentForm({ ...assignmentForm, canAccessDraftConsole: e.target.checked })} /> Draft</label>
                <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={assignmentForm.canAccessScanner} onChange={(e) => setAssignmentForm({ ...assignmentForm, canAccessScanner: e.target.checked })} /> Scanner</label>
                <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={assignmentForm.canAccessFinance} onChange={(e) => setAssignmentForm({ ...assignmentForm, canAccessFinance: e.target.checked })} /> Finance</label>
              </div>
              <button onClick={saveAssignment} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Assignment</button>
            </SectionCard>
          </>
        ) : null}

        {activeTab === "revenue" ? (
          <>
            <SectionCard title="Revenue Ledger Entry" subtitle="Track all money in and money out.">
              <div className="grid gap-4 md:grid-cols-4">
                <select value={revenueForm.streamCode} onChange={(e) => setRevenueForm({ ...revenueForm, streamCode: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                  <option value="ticketing">Ticketing</option>
                  <option value="merch">Merch</option>
                  <option value="sponsors">Sponsors</option>
                  <option value="add_ons">Add-ons</option>
                  <option value="staff_pay">Staff Pay</option>
                  <option value="operations">Operations</option>
                </select>
                <select value={revenueForm.moneyDirection} onChange={(e) => setRevenueForm({ ...revenueForm, moneyDirection: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                  <option value="in">Money In</option>
                  <option value="out">Money Out</option>
                </select>
                <input value={revenueForm.amountUsd} onChange={(e) => setRevenueForm({ ...revenueForm, amountUsd: e.target.value })} placeholder="Amount USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={revenueForm.memo} onChange={(e) => setRevenueForm({ ...revenueForm, memo: e.target.value })} placeholder="Memo" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              </div>
              <button onClick={saveRevenue} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Revenue Entry</button>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-white/[0.04]">
                    <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-4 py-4">Stream</th>
                      <th className="px-4 py-4">Direction</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30">
                    {revenueEntries.map((row: any) => (
                      <tr key={row.id}>
                        <td className="px-4 py-4">{row.stream_code}</td>
                        <td className="px-4 py-4 text-white/70">{row.money_direction}</td>
                        <td className="px-4 py-4 text-white/70">${Number(row.amount_usd || 0).toFixed(2)}</td>
                        <td className="px-4 py-4 text-white/70">{row.memo || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Sponsor Manager" subtitle="Track sponsor opportunities and value.">
              <div className="grid gap-4 md:grid-cols-4">
                <input value={sponsorForm.companyName} onChange={(e) => setSponsorForm({ ...sponsorForm, companyName: e.target.value })} placeholder="Company Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.contactName} onChange={(e) => setSponsorForm({ ...sponsorForm, contactName: e.target.value })} placeholder="Contact Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.contactEmail} onChange={(e) => setSponsorForm({ ...sponsorForm, contactEmail: e.target.value })} placeholder="Contact Email" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.packageName} onChange={(e) => setSponsorForm({ ...sponsorForm, packageName: e.target.value })} placeholder="Package Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.cashValueUsd} onChange={(e) => setSponsorForm({ ...sponsorForm, cashValueUsd: e.target.value })} placeholder="Cash Value USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.inKindValueUsd} onChange={(e) => setSponsorForm({ ...sponsorForm, inKindValueUsd: e.target.value })} placeholder="In-Kind Value USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={sponsorForm.notes} onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })} placeholder="Notes" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
              </div>
              <button onClick={saveSponsor} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Sponsor</button>
            </SectionCard>

            <SectionCard title="Merch Manager" subtitle="Manage merch catalog and inventory.">
              <div className="grid gap-4 md:grid-cols-4">
                <input value={merchForm.sku} onChange={(e) => setMerchForm({ ...merchForm, sku: e.target.value })} placeholder="SKU" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={merchForm.itemName} onChange={(e) => setMerchForm({ ...merchForm, itemName: e.target.value })} placeholder="Item Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={merchForm.itemType} onChange={(e) => setMerchForm({ ...merchForm, itemType: e.target.value })} placeholder="Item Type" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={merchForm.priceUsd} onChange={(e) => setMerchForm({ ...merchForm, priceUsd: e.target.value })} placeholder="Price USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={merchForm.costUsd} onChange={(e) => setMerchForm({ ...merchForm, costUsd: e.target.value })} placeholder="Cost USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={merchForm.inventoryCount} onChange={(e) => setMerchForm({ ...merchForm, inventoryCount: e.target.value })} placeholder="Inventory Count" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              </div>
              <button onClick={saveMerch} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Merch</button>
            </SectionCard>

            <SectionCard title="Add-On Manager" subtitle="Track paid extras and operational extras.">
              <div className="grid gap-4 md:grid-cols-4">
                <input value={addOnForm.code} onChange={(e) => setAddOnForm({ ...addOnForm, code: e.target.value })} placeholder="Code" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={addOnForm.itemName} onChange={(e) => setAddOnForm({ ...addOnForm, itemName: e.target.value })} placeholder="Item Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={addOnForm.description} onChange={(e) => setAddOnForm({ ...addOnForm, description: e.target.value })} placeholder="Description" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                <input value={addOnForm.priceUsd} onChange={(e) => setAddOnForm({ ...addOnForm, priceUsd: e.target.value })} placeholder="Price USD" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              </div>
              <button onClick={saveAddOn} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Add-On</button>
            </SectionCard>
          </>
        ) : null}

        {activeTab === "hiring" ? (
          <SectionCard title="Opportunity Manager" subtitle="Create and manage roles for the public jobs and volunteer page.">
            <div className="grid gap-4 md:grid-cols-4">
              <input value={opportunityForm.roleCode} onChange={(e) => setOpportunityForm({ ...opportunityForm, roleCode: e.target.value })} placeholder="Role Code" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              <input value={opportunityForm.title} onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })} placeholder="Title" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              <input value={opportunityForm.department} onChange={(e) => setOpportunityForm({ ...opportunityForm, department: e.target.value })} placeholder="Department" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              <select value={opportunityForm.opportunityType} onChange={(e) => setOpportunityForm({ ...opportunityForm, opportunityType: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                <option value="paid">Paid</option>
                <option value="incentivized">Incentivized</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <input value={opportunityForm.summary} onChange={(e) => setOpportunityForm({ ...opportunityForm, summary: e.target.value })} placeholder="Summary" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
              <input value={opportunityForm.description} onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })} placeholder="Description" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
              <input value={opportunityForm.requirements} onChange={(e) => setOpportunityForm({ ...opportunityForm, requirements: e.target.value })} placeholder="Requirements comma separated" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
              <input value={opportunityForm.perks} onChange={(e) => setOpportunityForm({ ...opportunityForm, perks: e.target.value })} placeholder="Perks comma separated" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
              <input value={opportunityForm.payLabel} onChange={(e) => setOpportunityForm({ ...opportunityForm, payLabel: e.target.value })} placeholder="Pay Label" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
              <input value={opportunityForm.displayOrder} onChange={(e) => setOpportunityForm({ ...opportunityForm, displayOrder: e.target.value })} placeholder="Display Order" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            </div>
            <button onClick={saveOpportunity} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Opportunity</button>

            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left">
                <thead className="bg-white/[0.04]">
                  <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                    <th className="px-4 py-4">Title</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-black/30">
                  {opportunities.map((opp: any) => (
                    <tr key={opp.id}>
                      <td className="px-4 py-4">{opp.title}</td>
                      <td className="px-4 py-4 text-white/70">{opp.department}</td>
                      <td className="px-4 py-4 text-white/70">{opp.opportunity_type}</td>
                      <td className="px-4 py-4 text-white/70">{opp.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </main>
  );
}
