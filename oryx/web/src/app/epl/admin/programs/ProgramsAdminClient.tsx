"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS } from "@/lib/city-options";

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProgramsAdminClient() {
  const [members, setMembers] = useState<any[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<"all" | "signal" | "ambassador">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "applicant" | "reviewing" | "active" | "paused" | "archived" | "rejected"
  >("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    id: "",
    program_key: "signal",
    status: "applicant",
    activation_state: "pending",
    activation_readiness: "review_needed",
    performance_stage: "new",
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    assigned_manager_user_id: "",
    role_tags: "",
    referral_ready: false,
    referral_code: "",
    referral_slug: "",
    referred_count: 0,
    notes: "",
  });

  async function load() {
    const [membersRes, usersRes] = await Promise.all([
      fetch("/api/admin/program-members", { cache: "no-store" }),
      fetch("/api/admin/operator-users", { cache: "no-store" }),
    ]);
    const json = (await membersRes.json()) as { members?: any[]; error?: string };
    const usersJson = (await usersRes.json()) as { users?: any[]; error?: string };
    if (!membersRes.ok) {
      setMessage(json.error || "Could not load Signal and Ambassador members.");
      return;
    }
    if (!usersRes.ok) {
      setMessage(usersJson.error || "Could not load internal managers.");
      return;
    }
    setMembers(json.members || []);
    setOperatorUsers(usersJson.users || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProgramMember(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/program-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        role_tags: parseList(form.role_tags),
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save program member.");
      return;
    }
    setMessage(form.id ? "Program member updated." : "Program member created.");
    setForm({
      id: "",
      program_key: "signal",
      status: "applicant",
      activation_state: "pending",
      activation_readiness: "review_needed",
      performance_stage: "new",
      full_name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      assigned_manager_user_id: "",
      role_tags: "",
      referral_ready: false,
      referral_code: "",
      referral_slug: "",
      referred_count: 0,
      notes: "",
    });
    await load();
  }

  function resetForm() {
    setSelectedMemberId(null);
    setForm({
      id: "",
      program_key: "signal",
      status: "applicant",
      activation_state: "pending",
      activation_readiness: "review_needed",
      performance_stage: "new",
      full_name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      assigned_manager_user_id: "",
      role_tags: "",
      referral_ready: false,
      referral_code: "",
      referral_slug: "",
      referred_count: 0,
      notes: "",
    });
  }

  const summary = useMemo(
    () => ({
      pendingReview: members.filter((member) => member.status === "applicant" || member.status === "reviewing").length,
      activeSignal: members.filter((member) => member.program_key === "signal" && member.activation_state === "enabled").length,
      activeAmbassadors: members.filter((member) => member.program_key === "ambassador" && member.activation_state === "enabled").length,
      referralReady: members.filter((member) => member.referral_ready || member.activation_readiness === "ready" || member.activation_readiness === "active").length,
    }),
    [members],
  );

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (programFilter !== "all" && member.program_key !== programFilter) return false;
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return [
        member.full_name,
        member.email,
        member.city,
        member.state,
        member.referral_code,
        member.program_key,
        member.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [members, programFilter, query, statusFilter]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || null,
    [members, selectedMemberId],
  );

  useEffect(() => {
    if (!selectedMemberId && members[0]?.id) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  function openMember(member: any) {
    setSelectedMemberId(member.id);
    setForm({
      id: member.id,
      program_key: member.program_key || "signal",
      status: member.status || "applicant",
      activation_state: member.activation_state || "pending",
      activation_readiness: member.activation_readiness || "review_needed",
      performance_stage: member.performance_stage || "new",
      full_name: member.full_name || "",
      email: member.email || "",
      phone: member.phone || "",
      city: member.city || "",
      state: member.state || "",
      assigned_manager_user_id: member.assigned_manager_user_id || "",
      role_tags: Array.isArray(member.role_tags) ? member.role_tags.join(", ") : "",
      referral_ready: Boolean(member.referral_ready),
      referral_code: member.referral_code || "",
      referral_slug: member.referral_slug || "",
      referred_count: Number(member.referred_count || 0),
      notes: member.notes || "",
    });
  }

  async function applyQuickStatus(id: string, patch: Record<string, unknown>, successMessage: string) {
    setMessage("");
    const member = members.find((row) => row.id === id);
    if (!member) return;
    const res = await fetch("/api/admin/program-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...member,
        ...patch,
        id,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update program member.");
      return;
    }
    setMessage(successMessage);
    await load();
  }

  return (
    <main className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 lg:px-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Network programs</div>
            <h1 className="ev-title">Run Signal and Ambassador as real operating programs.</h1>
            <p className="ev-subtitle">
              Review applicants, assign a manager, activate members, and keep referral-ready people moving from one clear desk.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Pending review", summary.pendingReview],
              ["Active Signal", summary.activeSignal],
              ["Active Ambassadors", summary.activeAmbassadors],
              ["Referral ready", summary.referralReady],
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

      <div className="mt-12 grid gap-8 lg:grid-cols-[400px_1fr_400px]">
        {/* Column 1: Roster & Queue */}
        <section className="ev-panel p-6 h-fit max-h-[1000px] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="ev-section-kicker">Program roster</div>
              <h2 className="mt-1 text-xl font-bold text-white">Queue</h2>
            </div>
            <button type="button" className="ev-button-primary scale-90" onClick={resetForm}>
              New Member
            </button>
          </div>

          <div className="grid gap-3 sticky top-0 bg-[#0c0c15] pb-4 z-10">
            <input
              className="ev-field"
              placeholder="Search members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select className="ev-field text-xs" value={programFilter} onChange={(e) => setProgramFilter(e.target.value as typeof programFilter)}>
                <option value="all">All programs</option>
                <option value="signal">Signal</option>
                <option value="ambassador">Ambassador</option>
              </select>
              <select className="ev-field text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                <option value="all">All statuses</option>
                {["applicant", "reviewing", "active", "paused", "archived", "rejected"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-white/30">No members match filters.</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => openMember(member)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    selectedMemberId === member.id
                      ? "border-[#A259FF]/45 bg-[#A259FF]/10 shadow-[0_0_20px_rgba(162,89,255,0.1)]"
                      : "border-white/10 bg-black/30 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">
                    <span>{member.program_key}</span>
                    <span>{member.status}</span>
                  </div>
                  <div className="mt-2 text-base font-bold text-white tracking-tight">{member.full_name || member.email}</div>
                  <div className="mt-1 text-xs text-white/40 truncate">
                    {member.city || "No city"}{member.state ? `, ${member.state}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Column 2: Member Identity & Program Status */}
        <section className="flex flex-col gap-8">
          <section className="ev-panel p-8">
            <div className="ev-section-kicker">Member editor</div>
            <h2 className="mt-3 text-3xl font-black text-white tracking-tight">
              {form.id ? "Update member record" : "Create member"}
            </h2>
            
            <form onSubmit={saveProgramMember} className="mt-10 grid gap-10">
              {/* Identity Section */}
              <div className="grid gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30">Identity</div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Full name</label>
                    <input className="ev-field" placeholder="First Last" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Email address</label>
                    <input className="ev-field" type="email" placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Phone</label>
                    <input className="ev-field" placeholder="555-000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">City</label>
                    <input className="ev-field" list="program-member-city-options" placeholder="Select city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">State</label>
                    <input className="ev-field" placeholder="ST" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Program Alignment Section */}
              <div className="grid gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/30">Program Alignment</div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Active program</label>
                    <select className="ev-field" value={form.program_key} onChange={(e) => setForm({ ...form, program_key: e.target.value })}>
                      <option value="signal">Signal</option>
                      <option value="ambassador">Ambassador</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Stage status</label>
                    <select className="ev-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {["applicant", "reviewing", "active", "paused", "archived", "rejected"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Activation state</label>
                    <select className="ev-field" value={form.activation_state} onChange={(e) => setForm({ ...form, activation_state: e.target.value })}>
                      {["pending", "enabled", "paused", "inactive"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Readiness</label>
                    <select className="ev-field" value={form.activation_readiness} onChange={(e) => setForm({ ...form, activation_readiness: e.target.value })}>
                      {["not_ready", "review_needed", "ready", "active"].map((status) => (
                        <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Performance</label>
                    <select className="ev-field" value={form.performance_stage} onChange={(e) => setForm({ ...form, performance_stage: e.target.value })}>
                      {["new", "developing", "active", "high_potential"].map((status) => (
                        <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4">
                <button type="submit" className="ev-button-primary px-10">{form.id ? "Save member record" : "Create record"}</button>
                <button type="button" className="ev-button-secondary" onClick={resetForm}>Discard changes</button>
              </div>
            </form>
          </section>
        </section>

        {/* Column 3: Ownership, Referrals & Notes */}
        <section className="flex flex-col gap-8 h-fit">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Status & Quick actions</div>
            {selectedMember ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Stage</div>
                    <div className="mt-1 text-sm font-bold text-white uppercase">{form.status}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Readiness</div>
                    <div className="mt-1 text-sm font-bold text-[#caa7ff] uppercase">{form.activation_readiness.replace(/_/g, " ")}</div>
                  </div>
                </div>
                <div className="grid gap-2 pt-2">
                  <button type="button" className="ev-button-secondary w-full text-xs font-bold" onClick={() => void applyQuickStatus(selectedMember.id, { status: "reviewing" }, "Reviewing...")}>Mark for review</button>
                  <button type="button" className="ev-button-secondary w-full text-xs font-bold border-emerald-500/20 text-emerald-400" onClick={() => void applyQuickStatus(selectedMember.id, { status: "active", activation_state: "enabled", activation_readiness: "active" }, "Activated")}>Activate member</button>
                  <button type="button" className="ev-button-secondary w-full text-xs font-bold text-amber-400" onClick={() => void applyQuickStatus(selectedMember.id, { status: "paused" }, "Pause member")}>Pause member</button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-6 border border-dashed border-white/10 rounded-2xl text-center">
                <p className="text-xs text-white/30 leading-relaxed">Select a member to access quick status actions and internal routing.</p>
              </div>
            )}
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Ownership & Referrals</div>
            <div className="mt-5 grid gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Assigned manager</label>
                <select className="ev-field" value={form.assigned_manager_user_id} onChange={(e) => setForm({ ...form, assigned_manager_user_id: e.target.value })}>
                  <option value="">No manager assigned</option>
                  {operatorUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>{user.full_name || user.email}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Referral setup</label>
                <div className="grid gap-3">
                  <input className="ev-field" placeholder="Referral code" value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} />
                  <input className="ev-field" placeholder="Referral slug" value={form.referral_slug} onChange={(e) => setForm({ ...form, referral_slug: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/60 hover:bg-white/5 transition cursor-pointer">
                <input type="checkbox" className="rounded bg-black/50 border-white/20" checked={form.referral_ready} onChange={(e) => setForm({ ...form, referral_ready: e.target.checked })} />
                Member is referral ready
              </label>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Internal notes</div>
            <textarea 
              className="ev-textarea mt-4 bg-black/40 min-h-[160px] text-sm" 
              placeholder="Internal context, activation blockers, or referral details..."
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })} 
            />
            <p className="mt-3 text-[10px] text-white/30 leading-relaxed uppercase tracking-widest text-center">Visibility: Internal staff only</p>
          </section>
        </section>
      </div>

      <datalist id="program-member-city-options">
        {INTERNAL_CITY_OPTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </main>
  );
}
