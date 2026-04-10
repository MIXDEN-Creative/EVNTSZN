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

  const summary = useMemo(
    () => ({
      pendingReview: members.filter((member) => member.status === "applicant" || member.status === "reviewing").length,
      activeSignal: members.filter((member) => member.program_key === "signal" && member.activation_state === "enabled").length,
      activeAmbassadors: members.filter((member) => member.program_key === "ambassador" && member.activation_state === "enabled").length,
      referralReady: members.filter((member) => member.referral_ready || member.activation_readiness === "ready" || member.activation_readiness === "active").length,
    }),
    [members],
  );

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
              Keep Signal and Ambassador separate, city-aware, and manageable from one controlled internal surface without pretending every part is fully automated yet.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Program intake</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Create or update Signal and Ambassador records</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Pending review", summary.pendingReview],
              ["Active Signal", summary.activeSignal],
              ["Active Ambassadors", summary.activeAmbassadors],
              ["Referral ready", summary.referralReady],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                <div className="mt-3 text-2xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
          <form onSubmit={saveProgramMember} className="mt-5 grid gap-4">
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
              <select className="ev-field" value={form.assigned_manager_user_id} onChange={(e) => setForm({ ...form, assigned_manager_user_id: e.target.value })}>
                <option value="">Assigned internal manager</option>
                {operatorUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name || user.email || user.user_id}
                  </option>
                ))}
              </select>
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
            <input className="ev-field" placeholder="Role or function tags (comma separated)" value={form.role_tags} onChange={(e) => setForm({ ...form, role_tags: e.target.value })} />
            <select className="ev-field" value={form.activation_state} onChange={(e) => setForm({ ...form, activation_state: e.target.value })}>
              {["pending", "enabled", "paused", "inactive"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-3">
              <input className="ev-field" placeholder="Referral code" value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} />
              <input className="ev-field" placeholder="Referral slug" value={form.referral_slug} onChange={(e) => setForm({ ...form, referral_slug: e.target.value })} />
              <input className="ev-field" type="number" placeholder="Referred count" value={form.referred_count} onChange={(e) => setForm({ ...form, referred_count: Number(e.target.value || 0) })} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
              <input type="checkbox" checked={form.referral_ready} onChange={(e) => setForm({ ...form, referral_ready: e.target.checked })} />
              Referral ready
            </label>
            <textarea className="ev-textarea" rows={4} placeholder="Internal notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="ev-button-primary">{form.id ? "Save member" : "Create member"}</button>
              {form.id ? (
                <button
                  type="button"
                  className="ev-button-secondary"
                  onClick={() =>
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
                    })
                  }
                >
                  New record
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Program roster</div>
          <div className="mt-5 space-y-3">
            {members.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/60">
                No Signal or Ambassador records have been added yet. Use this surface to manage controlled growth before program volume scales.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left"
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
                    <button
                      type="button"
                      className="ev-button-primary"
                      onClick={() =>
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
                        })
                      }
                    >
                      Open record
                    </button>
                    <button
                      type="button"
                      className="ev-button-secondary"
                      onClick={() => {
                        void applyQuickStatus(member.id, { status: "reviewing" }, "Program member moved to reviewing.");
                      }}
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      className="ev-button-secondary"
                      onClick={() => {
                        void applyQuickStatus(member.id, { status: "active", activation_state: "enabled", activation_readiness: "active" }, "Program member activated.");
                      }}
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      className="ev-button-secondary"
                      onClick={() => {
                        void applyQuickStatus(member.id, { status: "paused", activation_state: "paused" }, "Program member paused.");
                      }}
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      className="ev-button-secondary"
                      onClick={() => {
                        void applyQuickStatus(member.id, { status: "rejected", activation_state: "inactive", activation_readiness: "not_ready" }, "Program member rejected.");
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
