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
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Network programs</div>
            <h1 className="ev-title">Run Signal and Ambassador as real operating programs.</h1>
            <p className="ev-subtitle">
              Review applicants, assign a manager, activate members, and keep referral-ready people moving from one clear desk.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-6 grid gap-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Pending review", summary.pendingReview],
              ["Active Signal", summary.activeSignal],
              ["Active Ambassadors", summary.activeAmbassadors],
              ["Referral ready", summary.referralReady],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-panel p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                <div className="mt-3 text-2xl font-bold text-white">{value}</div>
              </div>
            ))}
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="ev-panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="ev-section-kicker">Program roster</div>
                <h2 className="mt-3 text-2xl font-bold text-white">Queue and review members</h2>
                <p className="mt-2 max-w-xl text-sm text-white/60">
                  Start from the queue, open a member record, then update status, manager assignment, and referral readiness from the detail panel.
                </p>
              </div>
              <button type="button" className="ev-button-primary" onClick={resetForm}>
                New member
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                className="ev-field"
                placeholder="Search name, email, city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select className="ev-field" value={programFilter} onChange={(e) => setProgramFilter(e.target.value as typeof programFilter)}>
                <option value="all">All programs</option>
                <option value="signal">Signal</option>
                <option value="ambassador">Ambassador</option>
              </select>
              <select className="ev-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                <option value="all">All statuses</option>
                {["applicant", "reviewing", "active", "paused", "archived", "rejected"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
                No program members match the current filters. Clear the queue filters or create a new Signal or Ambassador record.
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => openMember(member)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    selectedMemberId === member.id
                      ? "border-[#A259FF]/45 bg-[#A259FF]/10"
                      : "border-white/10 bg-black/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#caa7ff]">
                    <span>{member.program_key}</span>
                    <span>{member.status}</span>
                    <span>{member.activation_state}</span>
                    <span>{String(member.activation_readiness || "review_needed").replace(/_/g, " ")}</span>
                    {member.referral_ready ? <span>referral ready</span> : null}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{member.full_name || member.email}</div>
                  <div className="mt-2 text-sm text-white/60">
                    {member.city || "No city"}{member.state ? `, ${member.state}` : ""}{member.email ? ` · ${member.email}` : ""}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="ev-chip ev-chip--external">{String(member.performance_stage || "new").replace(/_/g, " ")}</span>
                    {member.referral_code ? <span className="ev-chip ev-chip--external">code: {member.referral_code}</span> : null}
                    {member.assigned_manager_user_id ? <span className="ev-chip ev-chip--external">manager assigned</span> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="ev-button-primary pointer-events-none">Open record</span>
                    <span className="ev-button-secondary pointer-events-none">Review</span>
                    <span className="ev-button-secondary pointer-events-none">Activate</span>
                  </div>
                </button>
              ))
            )}
            </div>
          </section>

          <section className="grid gap-6">
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">Member detail</div>
              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {form.id ? `Update ${form.full_name || "member record"}` : "Create a program member"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-white/60">
                    Use this panel to keep one member record clean: identity, program fit, manager assignment, referral readiness, and internal notes.
                  </p>
                </div>
                {selectedMember ? (
                  <div className="grid gap-2 text-sm text-white/65">
                    <div><span className="text-white/40">Program:</span> {selectedMember.program_key}</div>
                    <div><span className="text-white/40">Status:</span> {selectedMember.status}</div>
                    <div><span className="text-white/40">Readiness:</span> {String(selectedMember.activation_readiness || "review_needed").replace(/_/g, " ")}</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Program</div>
                  <div className="mt-2 text-base font-semibold text-white">{form.program_key === "ambassador" ? "Ambassador" : "Signal"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Status</div>
                  <div className="mt-2 text-base font-semibold text-white">{String(form.status).replace(/_/g, " ")}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Manager</div>
                  <div className="mt-2 text-base font-semibold text-white">{form.assigned_manager_user_id ? "Assigned" : "Unassigned"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Referral</div>
                  <div className="mt-2 text-base font-semibold text-white">{form.referral_ready ? "Ready" : "Not ready"}</div>
                </div>
              </div>

              <form onSubmit={saveProgramMember} className="mt-6 grid gap-6">
                <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Identity</div>
                    <div className="mt-2 text-lg font-semibold text-white">Who is this person?</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="ev-field" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    <input className="ev-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <input className="ev-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <input className="ev-field" list="program-member-city-options" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    <input className="ev-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                </section>

                <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Program status</div>
                    <div className="mt-2 text-lg font-semibold text-white">Set where they are in the program</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="ev-field" value={form.program_key} onChange={(e) => setForm({ ...form, program_key: e.target.value })}>
                      <option value="signal">Signal</option>
                      <option value="ambassador">Ambassador</option>
                    </select>
                    <select className="ev-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {["applicant", "reviewing", "active", "paused", "archived", "rejected"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <select className="ev-field" value={form.activation_state} onChange={(e) => setForm({ ...form, activation_state: e.target.value })}>
                      {["pending", "enabled", "paused", "inactive"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <select className="ev-field" value={form.activation_readiness} onChange={(e) => setForm({ ...form, activation_readiness: e.target.value })}>
                      {["not_ready", "review_needed", "ready", "active"].map((status) => (
                        <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <select className="ev-field" value={form.performance_stage} onChange={(e) => setForm({ ...form, performance_stage: e.target.value })}>
                      {["new", "developing", "active", "high_potential"].map((status) => (
                        <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Ownership and referrals</div>
                    <div className="mt-2 text-lg font-semibold text-white">Assign a manager and keep referral setup usable</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="ev-field" value={form.assigned_manager_user_id} onChange={(e) => setForm({ ...form, assigned_manager_user_id: e.target.value })}>
                      <option value="">Assigned internal manager</option>
                      {operatorUsers.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.full_name || user.email || user.user_id}
                        </option>
                      ))}
                    </select>
                    <input className="ev-field" placeholder="Role or function tags (comma separated)" value={form.role_tags} onChange={(e) => setForm({ ...form, role_tags: e.target.value })} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <input className="ev-field" placeholder="Referral code" value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} />
                    <input className="ev-field" placeholder="Referral slug" value={form.referral_slug} onChange={(e) => setForm({ ...form, referral_slug: e.target.value })} />
                    <input className="ev-field" type="number" placeholder="Referred count" value={form.referred_count} onChange={(e) => setForm({ ...form, referred_count: Number(e.target.value || 0) })} />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/75">
                    <input type="checkbox" checked={form.referral_ready} onChange={(e) => setForm({ ...form, referral_ready: e.target.checked })} />
                    This member is ready for referral use.
                  </label>
                </section>

                <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#caa7ff]">Notes</div>
                    <div className="mt-2 text-lg font-semibold text-white">Keep the handoff clear for the next operator</div>
                  </div>
                  <textarea className="ev-textarea" rows={5} placeholder="Internal notes, activation blockers, referral details, or follow-up context" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </section>

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="ev-button-primary">{form.id ? "Save member" : "Create member"}</button>
                  <button type="button" className="ev-button-secondary" onClick={resetForm}>
                    Clear panel
                  </button>
                  {selectedMember ? (
                    <>
                      <button
                        type="button"
                        className="ev-button-secondary"
                        onClick={() => {
                          void applyQuickStatus(selectedMember.id, { status: "reviewing" }, "Program member moved to reviewing.");
                        }}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        className="ev-button-secondary"
                        onClick={() => {
                          void applyQuickStatus(selectedMember.id, { status: "active", activation_state: "enabled", activation_readiness: "active" }, "Program member activated.");
                        }}
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        className="ev-button-secondary"
                        onClick={() => {
                          void applyQuickStatus(selectedMember.id, { status: "paused", activation_state: "paused" }, "Program member paused.");
                        }}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        className="ev-button-secondary"
                        onClick={() => {
                          void applyQuickStatus(selectedMember.id, { status: "rejected", activation_state: "inactive", activation_readiness: "not_ready" }, "Program member rejected.");
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </section>
          </section>
        </div>
      </div>
      <datalist id="program-member-city-options">
        {INTERNAL_CITY_OPTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </main>
  );
}
