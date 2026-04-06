"use client";

import { useEffect, useMemo, useState } from "react";

type NavKey =
  | "overview"
  | "player_pipeline"
  | "staffing"
  | "coaches"
  | "sponsors"
  | "merch"
  | "jobs";

type RowAction = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

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
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85"
      >
        Actions
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0b0b0b] p-2 shadow-2xl">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                action.danger ? "text-red-300 hover:bg-red-500/10" : "text-white/85 hover:bg-white/[0.06]"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailDrawer({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-2 text-sm text-white/55">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  placeholder = "Search",
}: {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-5 grid gap-4 md:grid-cols-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="approved">Approved</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
        <option value="declined">Declined</option>
        <option value="archived">Archived</option>
      </select>
      <div className="flex items-center text-sm text-white/45">
        Filtered workspace view
      </div>
    </div>
  );
}

export default function LeagueOfficeAdminShell() {
  const [active, setActive] = useState<NavKey>("overview");
  const [seasonSlug, setSeasonSlug] = useState("season-1");
  const [seasons, setSeasons] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [permissionScope, setPermissionScope] = useState("founder");

  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [playerPipeline, setPlayerPipeline] = useState<any[]>([]);
  const [staffApplications, setStaffApplications] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [merch, setMerch] = useState<any[]>([]);
  const [merchSales, setMerchSales] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);

  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const [coachForm, setCoachForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    coachType: "head_coach",
    status: "active",
    assignedTeamId: "",
    yearsExperience: "",
    specialties: "",
    bio: "",
  });

  const [deliverableForm, setDeliverableForm] = useState({
    sponsorPartnerId: "",
    deliverableTitle: "",
    deliverableType: "logo_placement",
    dueAt: "",
    notes: "",
  });

  const [merchSaleForm, setMerchSaleForm] = useState({
    merchCatalogId: "",
    quantity: "1",
    grossAmountCents: "",
    costAmountCents: "",
    saleChannel: "on_site",
    soldAt: "",
    notes: "",
  });

  async function load() {
    const [
      seasonsRes,
      playersRes,
      staffAppRes,
      staffAssignRes,
      oppRes,
      sponsorsRes,
      packagesRes,
      deliverablesRes,
      merchRes,
      merchSalesRes,
      addOnsRes,
      revenueRes,
      coachesRes,
    ] = await Promise.all([
      fetch(`/api/epl/admin/seasons`),
      fetch(`/api/epl/admin/operations-player-pipeline?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/staff-applications?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/staff-assignments?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/opportunities`),
      fetch(`/api/epl/admin/sponsors?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/sponsorship-packages`),
      fetch(`/api/epl/admin/sponsor-deliverables`),
      fetch(`/api/epl/admin/merch?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/merch-sales`),
      fetch(`/api/epl/admin/add-ons?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/revenue-ledger?seasonSlug=${seasonSlug}`),
      fetch(`/api/epl/admin/coaches`),
    ]);

    const seasonsJson = await seasonsRes.json();
    const playersJson = await playersRes.json();
    const staffAppJson = await staffAppRes.json();
    const staffAssignJson = await staffAssignRes.json();
    const oppJson = await oppRes.json();
    const sponsorsJson = await sponsorsRes.json();
    const packagesJson = await packagesRes.json();
    const deliverablesJson = await deliverablesRes.json();
    const merchJson = await merchRes.json();
    const merchSalesJson = await merchSalesRes.json();
    const addOnsJson = await addOnsRes.json();
    const revenueJson = await revenueRes.json();
    const coachesJson = await coachesRes.json();

    setSeasons(seasonsJson.seasons || []);
    setPlayerPipeline(playersJson.entries || []);
    setStaffApplications(staffAppJson.applications || []);
    setStaffAssignments(staffAssignJson.assignments || []);
    setRoles(staffAssignJson.roles || []);
    setOpportunities(oppJson.opportunities || []);
    setSponsors(sponsorsJson.sponsors || []);
    setPackages(packagesJson.packages || []);
    setDeliverables(deliverablesJson.deliverables || []);
    setMerch(merchJson.merch || []);
    setMerchSales(merchSalesJson.sales || []);
    setAddOns(addOnsJson.addOns || []);
    setRevenueEntries(revenueJson.entries || []);
    setCoaches(coachesJson.coaches || []);
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  async function recordAction(table: string, id: string, action: string) {
    const res = await fetch("/api/epl/admin/record-actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ table, id, action }),
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Could not update record.");
      return;
    }

    setMessage("Record updated.");
    await load();
  }

  async function saveCoach() {
    const res = await fetch("/api/epl/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonSlug,
        ...coachForm,
        specialties: coachForm.specialties.split(",").map(v => v.trim()).filter(Boolean),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Could not save coach.");
      return;
    }

    setMessage("Coach saved.");
    setCoachForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      coachType: "head_coach",
      status: "active",
      assignedTeamId: "",
      yearsExperience: "",
      specialties: "",
      bio: "",
    });
    await load();
  }

  async function saveDeliverable() {
    const res = await fetch("/api/epl/admin/sponsor-deliverables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorPartnerId: deliverableForm.sponsorPartnerId,
        deliverableTitle: deliverableForm.deliverableTitle,
        deliverableType: deliverableForm.deliverableType,
        dueAt: deliverableForm.dueAt || null,
        notes: deliverableForm.notes,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Could not save deliverable.");
      return;
    }

    setMessage("Sponsor deliverable saved.");
    setDeliverableForm({
      sponsorPartnerId: "",
      deliverableTitle: "",
      deliverableType: "logo_placement",
      dueAt: "",
      notes: "",
    });
    await load();
  }

  async function saveMerchSale() {
    const res = await fetch("/api/epl/admin/merch-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonSlug,
        ...merchSaleForm,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Could not save merch sale.");
      return;
    }

    setMessage("Merch sale saved.");
    setMerchSaleForm({
      merchCatalogId: "",
      quantity: "1",
      grossAmountCents: "",
      costAmountCents: "",
      saleChannel: "on_site",
      soldAt: "",
      notes: "",
    });
    await load();
  }

  function openDetails(title: string, row: any) {
    setSelectedTitle(title);
    setSelectedRow(row);
  }

  function matchesSearch(row: any, keys: string[]) {
    if (!globalSearch) return true;
    const q = globalSearch.toLowerCase();
    return keys
      .map((k) => row?.[k])
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  }

  function matchesStatus(row: any, keys: string[]) {
    if (!statusFilter) return true;
    return keys.some((k) => String(row?.[k] || "").toLowerCase() === statusFilter.toLowerCase());
  }

  const filteredPlayers = useMemo(() => {
    return playerPipeline.filter((row) =>
      matchesSearch(row, ["player_name", "application_status", "registration_status", "pipeline_stage"]) &&
      matchesStatus(row, ["application_status", "registration_status", "pipeline_stage"])
    );
  }, [playerPipeline, globalSearch, statusFilter]);

  const filteredStaffApps = useMemo(() => {
    return staffApplications.filter((row) =>
      matchesSearch(row, ["applicant_name", "application_status"]) &&
      matchesStatus(row, ["application_status"])
    );
  }, [staffApplications, globalSearch, statusFilter]);

  const filteredCoaches = useMemo(() => {
    return coaches.filter((row) =>
      matchesSearch(row, ["coach_name", "coach_type", "team_name", "status"]) &&
      matchesStatus(row, ["status", "coach_type"])
    );
  }, [coaches, globalSearch, statusFilter]);

  const filteredSponsors = useMemo(() => {
    return sponsors.filter((row) =>
      matchesSearch(row, ["company_name", "contact_name", "package_name", "partner_status"]) &&
      matchesStatus(row, ["partner_status"])
    );
  }, [sponsors, globalSearch, statusFilter]);

  const filteredJobs = useMemo(() => {
    return opportunities.filter((row) =>
      matchesSearch(row, ["title", "department", "opportunity_type", "status"]) &&
      matchesStatus(row, ["status", "opportunity_type"])
    );
  }, [opportunities, globalSearch, statusFilter]);

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((row) =>
      matchesSearch(row, ["company_name", "deliverable_title", "deliverable_type", "status"]) &&
      matchesStatus(row, ["status", "deliverable_type"])
    );
  }, [deliverables, globalSearch, statusFilter]);

  const filteredMerchSales = useMemo(() => {
    return merchSales.filter((row) =>
      matchesSearch(row, ["item_name", "sku", "sale_channel"]) &&
      matchesStatus(row, ["sale_channel"])
    );
  }, [merchSales, globalSearch, statusFilter]);

  const totals = useMemo(() => {
    const moneyIn = revenueEntries.filter((r) => r.money_direction === "in").reduce((sum, r) => sum + (r.amount_cents || 0), 0);
    const moneyOut = revenueEntries.filter((r) => r.money_direction === "out").reduce((sum, r) => sum + (r.amount_cents || 0), 0);
    const merchGross = merchSales.reduce((sum, r) => sum + (r.gross_amount_cents || 0), 0);
    return {
      players: playerPipeline.length,
      staffApps: staffApplications.length,
      coaches: coaches.length,
      sponsors: sponsors.length,
      jobs: opportunities.length,
      moneyIn,
      moneyOut,
      merchGross,
      net: moneyIn - moneyOut,
    };
  }, [playerPipeline, staffApplications, coaches, sponsors, opportunities, revenueEntries, merchSales]);

  const visibleNav = [
    { key: "overview" as NavKey, label: "Overview", scopes: ["founder", "admin", "ops", "revenue", "staffing"] },
    { key: "player_pipeline" as NavKey, label: "Player Pipeline", scopes: ["founder", "admin", "ops", "staffing"] },
    { key: "staffing" as NavKey, label: "Staffing", scopes: ["founder", "admin", "ops", "staffing"] },
    { key: "coaches" as NavKey, label: "Coaches", scopes: ["founder", "admin", "ops", "staffing"] },
    { key: "sponsors" as NavKey, label: "Sponsors", scopes: ["founder", "admin", "revenue"] },
    { key: "merch" as NavKey, label: "Merch & Revenue", scopes: ["founder", "admin", "revenue"] },
    { key: "jobs" as NavKey, label: "Jobs & Opportunities", scopes: ["founder", "admin", "staffing"] },
  ].filter((item) => item.scopes.includes(permissionScope));

  useEffect(() => {
    if (!visibleNav.some((item) => item.key === active)) {
      setActive(visibleNav[0]?.key || "overview");
    }
  }, [permissionScope]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="w-[290px] border-r border-white/10 bg-[#050505] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Operations</p>
            <h1 className="mt-3 text-3xl font-semibold">League Office</h1>
            <p className="mt-3 text-sm text-white/50">Internal company workspace for EPL.</p>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-[11px] uppercase tracking-[0.24em] text-white/45">Season</label>
            <select
              value={seasonSlug}
              onChange={(e) => setSeasonSlug(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.slug}>
                  {season.name} ({season.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-[11px] uppercase tracking-[0.24em] text-white/45">Permission View</label>
            <select
              value={permissionScope}
              onChange={(e) => setPermissionScope(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            >
              <option value="founder">Founder</option>
              <option value="admin">Admin</option>
              <option value="ops">Operations</option>
              <option value="revenue">Revenue</option>
              <option value="staffing">Staffing</option>
            </select>
          </div>

          <nav className="mt-8 space-y-2">
            {visibleNav.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium ${
                  active === item.key
                    ? "bg-[#A259FF] text-white"
                    : "border border-white/10 bg-white/[0.03] text-white/75"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {message ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">
              {message}
            </div>
          ) : null}
        </aside>

        <section className="flex-1 p-8">
          {active === "overview" ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-semibold">Overview</h2>
                <p className="mt-3 text-white/60">Executive view across people, sponsors, jobs, and revenue.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Players" value={totals.players} />
                <StatCard label="Staff Apps" value={totals.staffApps} />
                <StatCard label="Coaches" value={totals.coaches} />
                <StatCard label="Jobs" value={totals.jobs} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Sponsors" value={totals.sponsors} />
                <StatCard label="Money In" value={`$${(totals.moneyIn / 100).toFixed(2)}`} />
                <StatCard label="Money Out" value={`$${(totals.moneyOut / 100).toFixed(2)}`} />
                <StatCard label="Net" value={`$${(totals.net / 100).toFixed(2)}`} />
              </div>

              <SectionCard title="Richer Staffing Board" subtitle="Live role bank for current season operations.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {roles.slice(0, 12).map((role: any) => (
                    <div key={role.id} className="rounded-[22px] border border-white/10 bg-black/30 p-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">{role.department}</div>
                      <h3 className="mt-2 text-xl font-semibold">{role.display_name}</h3>
                      <p className="mt-2 text-sm text-white/55">
                        {role.default_compensation_tier} • {role.is_essential ? "Essential" : "Support"}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {active === "player_pipeline" ? (
            <SectionCard title="Player Pipeline" subtitle="Searchable player intake and draft prep.">
              <FilterBar
                search={globalSearch}
                setSearch={setGlobalSearch}
                status={statusFilter}
                setStatus={setStatusFilter}
                placeholder="Search players"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-white/[0.04]">
                    <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-4 py-4">Player</th>
                      <th className="px-4 py-4">Application</th>
                      <th className="px-4 py-4">Registration</th>
                      <th className="px-4 py-4">Pipeline</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30">
                    {filteredPlayers.map((row: any) => (
                      <tr key={row.application_id}>
                        <td className="px-4 py-4">{row.player_name}</td>
                        <td className="px-4 py-4 text-white/70">{row.application_status}</td>
                        <td className="px-4 py-4 text-white/70">{row.registration_status || "—"}</td>
                        <td className="px-4 py-4 text-white/70">{row.pipeline_stage}</td>
                        <td className="px-4 py-4">
                          <ActionMenu
                            actions={[
                              {
                                label: "View Details",
                                onClick: () => openDetails("Player Details", row),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ) : null}

          {active === "staffing" ? (
            <div className="space-y-6">
              <SectionCard title="Staff Applications" subtitle="Search, review, and manage staffing pipeline.">
                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Search staff applications"
                />
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
                      {filteredStaffApps.map((row: any) => (
                        <tr key={row.staff_application_id}>
                          <td className="px-4 py-4">{row.applicant_name}</td>
                          <td className="px-4 py-4 text-white/70">{row.application_status}</td>
                          <td className="px-4 py-4 text-white/70">{(row.preferred_roles || []).join(", ") || "—"}</td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Staff Application", row) },
                                {
                                  label: "Archive",
                                  onClick: () => recordAction("staff_applications", row.staff_application_id, "archive"),
                                  danger: true,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Richer Staffing Board" subtitle="Assignments, roles, and permissions.">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                        <th className="px-4 py-4">Role</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Tier</th>
                        <th className="px-4 py-4">Permissions</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {staffAssignments.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-4">{row.staff_roles_catalog?.display_name || "—"}</td>
                          <td className="px-4 py-4 text-white/70">{row.assignment_status}</td>
                          <td className="px-4 py-4 text-white/70">{row.compensation_tier}</td>
                          <td className="px-4 py-4 text-white/70">
                            {[
                              row.can_access_admin ? "Admin" : null,
                              row.can_access_draft_console ? "Draft" : null,
                              row.can_access_scanner ? "Scanner" : null,
                              row.can_access_finance ? "Finance" : null,
                            ].filter(Boolean).join(", ") || "Basic"}
                          </td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Staff Assignment", row) },
                                {
                                  label: "Archive",
                                  onClick: () => recordAction("season_staff_assignments", row.id, "archive"),
                                  danger: true,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {active === "coaches" ? (
            <div className="space-y-6">
              <SectionCard title="Coach Manager" subtitle="Add and manage coaches for the season.">
                <div className="grid gap-4 md:grid-cols-4">
                  <input value={coachForm.firstName} onChange={(e) => setCoachForm({ ...coachForm, firstName: e.target.value })} placeholder="First Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.lastName} onChange={(e) => setCoachForm({ ...coachForm, lastName: e.target.value })} placeholder="Last Name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} placeholder="Email" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.phone} onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })} placeholder="Phone" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <select value={coachForm.coachType} onChange={(e) => setCoachForm({ ...coachForm, coachType: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                    <option value="head_coach">Head Coach</option>
                    <option value="assistant_coach">Assistant Coach</option>
                    <option value="offensive_coordinator">Offensive Coordinator</option>
                    <option value="defensive_coordinator">Defensive Coordinator</option>
                    <option value="team_manager">Team Manager</option>
                  </select>
                  <input value={coachForm.assignedTeamId} onChange={(e) => setCoachForm({ ...coachForm, assignedTeamId: e.target.value })} placeholder="Assigned Team ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.yearsExperience} onChange={(e) => setCoachForm({ ...coachForm, yearsExperience: e.target.value })} placeholder="Years Experience" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.specialties} onChange={(e) => setCoachForm({ ...coachForm, specialties: e.target.value })} placeholder="Specialties comma separated" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={coachForm.bio} onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })} placeholder="Bio" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-4" />
                </div>
                <button onClick={saveCoach} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Coach</button>
              </SectionCard>

              <SectionCard title="Coach Table" subtitle="Searchable, filterable, with row actions.">
                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Search coaches"
                />
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                        <th className="px-4 py-4">Coach</th>
                        <th className="px-4 py-4">Type</th>
                        <th className="px-4 py-4">Team</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {filteredCoaches.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-4">{row.coach_name}</td>
                          <td className="px-4 py-4 text-white/70">{row.coach_type}</td>
                          <td className="px-4 py-4 text-white/70">{row.team_name || "Unassigned"}</td>
                          <td className="px-4 py-4 text-white/70">{row.status}</td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Coach Details", row) },
                                {
                                  label: row.is_archived ? "Restore" : "Archive",
                                  onClick: () =>
                                    recordAction(
                                      "coach_profiles",
                                      row.id,
                                      row.is_archived ? "restore" : "archive"
                                    ),
                                  danger: !row.is_archived,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {active === "sponsors" ? (
            <div className="space-y-6">
              <SectionCard title="Sponsor Packages" subtitle="Imported package structure already loaded.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {packages.map((pkg: any) => (
                    <div key={pkg.id} className="rounded-[22px] border border-white/10 bg-black/30 p-4">
                      <h3 className="text-xl font-semibold">{pkg.package_name}</h3>
                      <p className="mt-2 text-sm text-white/60">{pkg.summary}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Sponsor Deliverables Tracker" subtitle="Operational sponsor fulfillment.">
                <div className="grid gap-4 md:grid-cols-4">
                  <input value={deliverableForm.sponsorPartnerId} onChange={(e) => setDeliverableForm({ ...deliverableForm, sponsorPartnerId: e.target.value })} placeholder="Sponsor Partner ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={deliverableForm.deliverableTitle} onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverableTitle: e.target.value })} placeholder="Deliverable Title" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <select value={deliverableForm.deliverableType} onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverableType: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                    <option value="logo_placement">Logo Placement</option>
                    <option value="sampling">Sampling</option>
                    <option value="vip_activation">VIP Activation</option>
                    <option value="on_site_presence">On-Site Presence</option>
                    <option value="marketing_mention">Marketing Mention</option>
                  </select>
                  <input value={deliverableForm.dueAt} onChange={(e) => setDeliverableForm({ ...deliverableForm, dueAt: e.target.value })} placeholder="Due At ISO datetime" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={deliverableForm.notes} onChange={(e) => setDeliverableForm({ ...deliverableForm, notes: e.target.value })} placeholder="Notes" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-4" />
                </div>
                <button onClick={saveDeliverable} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Deliverable</button>

                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Search deliverables"
                />

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                        <th className="px-4 py-4">Sponsor</th>
                        <th className="px-4 py-4">Deliverable</th>
                        <th className="px-4 py-4">Type</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {filteredDeliverables.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-4">{row.company_name}</td>
                          <td className="px-4 py-4 text-white/70">{row.deliverable_title}</td>
                          <td className="px-4 py-4 text-white/70">{row.deliverable_type}</td>
                          <td className="px-4 py-4 text-white/70">{row.status}</td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Deliverable Details", row) },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Sponsors" subtitle="Searchable sponsor record table.">
                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Search sponsors"
                />
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                        <th className="px-4 py-4">Company</th>
                        <th className="px-4 py-4">Contact</th>
                        <th className="px-4 py-4">Package</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {filteredSponsors.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-4">{row.company_name}</td>
                          <td className="px-4 py-4 text-white/70">{row.contact_name || "—"}</td>
                          <td className="px-4 py-4 text-white/70">{row.package_name || "—"}</td>
                          <td className="px-4 py-4 text-white/70">{row.partner_status}</td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Sponsor Details", row) },
                                {
                                  label: row.is_archived ? "Restore" : "Archive",
                                  onClick: () =>
                                    recordAction(
                                      "sponsor_partners",
                                      row.id,
                                      row.is_archived ? "restore" : "archive"
                                    ),
                                  danger: !row.is_archived,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {active === "merch" ? (
            <div className="space-y-6">
              <SectionCard title="Merch Sales Tracker" subtitle="Searchable merch sales and margin tracking.">
                <div className="grid gap-4 md:grid-cols-4">
                  <input value={merchSaleForm.merchCatalogId} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, merchCatalogId: e.target.value })} placeholder="Merch Catalog ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={merchSaleForm.quantity} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, quantity: e.target.value })} placeholder="Quantity" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={merchSaleForm.grossAmountCents} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, grossAmountCents: e.target.value })} placeholder="Gross Amount Cents" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={merchSaleForm.costAmountCents} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, costAmountCents: e.target.value })} placeholder="Cost Amount Cents" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <select value={merchSaleForm.saleChannel} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, saleChannel: e.target.value })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                    <option value="on_site">On Site</option>
                    <option value="online">Online</option>
                    <option value="preorder">Preorder</option>
                  </select>
                  <input value={merchSaleForm.soldAt} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, soldAt: e.target.value })} placeholder="Sold At ISO datetime" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  <input value={merchSaleForm.notes} onChange={(e) => setMerchSaleForm({ ...merchSaleForm, notes: e.target.value })} placeholder="Notes" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
                </div>
                <button onClick={saveMerchSale} className="mt-4 rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">Save Merch Sale</button>

                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  status={statusFilter}
                  setStatus={setStatusFilter}
                  placeholder="Search merch sales"
                />

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.04]">
                      <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                        <th className="px-4 py-4">Item</th>
                        <th className="px-4 py-4">Qty</th>
                        <th className="px-4 py-4">Gross</th>
                        <th className="px-4 py-4">Net</th>
                        <th className="px-4 py-4">Channel</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {filteredMerchSales.map((row: any) => (
                        <tr key={row.id}>
                          <td className="px-4 py-4">{row.item_name}</td>
                          <td className="px-4 py-4 text-white/70">{row.quantity}</td>
                          <td className="px-4 py-4 text-white/70">${((row.gross_amount_cents || 0) / 100).toFixed(2)}</td>
                          <td className="px-4 py-4 text-white/70">${((row.net_amount_cents || 0) / 100).toFixed(2)}</td>
                          <td className="px-4 py-4 text-white/70">{row.sale_channel}</td>
                          <td className="px-4 py-4">
                            <ActionMenu
                              actions={[
                                { label: "View Details", onClick: () => openDetails("Merch Sale", row) },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {active === "jobs" ? (
            <SectionCard title="Jobs & Opportunities" subtitle="Searchable publishing layer for jobs and volunteer roles.">
              <FilterBar
                search={globalSearch}
                setSearch={setGlobalSearch}
                status={statusFilter}
                setStatus={setStatusFilter}
                placeholder="Search jobs and opportunities"
              />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left">
                  <thead className="bg-white/[0.04]">
                    <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                      <th className="px-4 py-4">Title</th>
                      <th className="px-4 py-4">Department</th>
                      <th className="px-4 py-4">Type</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30">
                    {filteredJobs.map((row: any) => (
                      <tr key={row.id}>
                        <td className="px-4 py-4">{row.title}</td>
                        <td className="px-4 py-4 text-white/70">{row.department}</td>
                        <td className="px-4 py-4 text-white/70">{row.opportunity_type}</td>
                        <td className="px-4 py-4 text-white/70">{row.status}</td>
                        <td className="px-4 py-4">
                          <ActionMenu
                            actions={[
                              { label: "View Details", onClick: () => openDetails("Opportunity Details", row) },
                              {
                                label: row.is_archived ? "Restore" : "Archive",
                                onClick: () =>
                                  recordAction(
                                    "opportunities",
                                    row.id,
                                    row.is_archived ? "restore" : "archive"
                                  ),
                                danger: !row.is_archived,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ) : null}
        </section>
      </div>

      <DetailDrawer
        open={!!selectedRow}
        title={selectedTitle}
        subtitle="Record detail drawer"
        onClose={() => setSelectedRow(null)}
      >
        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
{JSON.stringify(selectedRow, null, 2)}
        </pre>
      </DetailDrawer>
    </main>
  );
}
