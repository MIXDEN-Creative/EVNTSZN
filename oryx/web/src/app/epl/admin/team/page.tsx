"use client";

import { useEffect, useState } from "react";

export default function AdminTeamPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [sending, setSending] = useState(false);

  async function loadData() {
    setLoading(true);

    const [rolesRes, teamRes, invitesRes] = await Promise.all([
      fetch("/api/admin/roles", { cache: "no-store" }),
      fetch("/api/admin/team", { cache: "no-store" }),
      fetch("/api/admin/invites", { cache: "no-store" }),
    ]);

    const rolesData = (await rolesRes.json()) as Record<string, any>;
    const teamData = (await teamRes.json()) as Record<string, any>;
    const invitesData = (await invitesRes.json()) as Record<string, any>;

    if (rolesRes.ok) setRoles(rolesData.roles || []);
    if (teamRes.ok) setTeam(teamData.team || []);
    if (invitesRes.ok) setInvites(invitesData.invites || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, full_name: fullName, role_id: roleId }),
    });

    const data = (await res.json()) as Record<string, any>;
    setSending(false);

    if (!res.ok) {
      alert(data.error || "Failed to send invite");
      return;
    }

    setEmail("");
    setFullName("");
    setRoleId("");
    loadData();
  }

  async function updateMembership(membershipId: string, update: Record<string, any>) {
    const res = await fetch("/api/admin/team/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ membershipId, ...update }),
    });

    const data = (await res.json()) as Record<string, any>;

    if (!res.ok) {
      alert(data.error || "Failed to update membership");
      return;
    }

    loadData();
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-6xl text-white/60">Loading team...</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">Team & Access</h1>
        <p className="mt-2 text-white/65">
          Invite admins, assign roles, and control who can access what.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Invite Admin</h2>

            <form onSubmit={sendInvite} className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Invite"}
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl font-bold">Pending & Past Invites</h3>
              <div className="mt-4 space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="font-bold">{invite.full_name || invite.email}</div>
                    <div className="text-white/60">{invite.email}</div>
                    <div className="mt-2 text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                      {invite.status} • {invite.admin_roles?.name || "No role"}
                    </div>
                  </div>
                ))}

                {invites.length === 0 ? (
                  <div className="text-white/50">No invites yet.</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Active Team</h2>

            <div className="mt-5 space-y-4">
              {team.map((member) => (
                <div key={member.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-bold">{member.app_users?.full_name || member.app_users?.email}</div>
                      <div className="text-white/55">{member.app_users?.email}</div>
                      <div className="mt-2 text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                        {member.admin_roles?.name || "No role"}
                        {member.is_owner ? " • Owner" : ""}
                        {member.is_active ? " • Active" : " • Inactive"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <select
                        defaultValue={member.admin_roles?.id || ""}
                        onChange={(e) =>
                          updateMembership(member.id, { roleId: e.target.value })
                        }
                        className="rounded-xl border border-white/10 bg-black px-4 py-2"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          updateMembership(member.id, { isActive: !member.is_active })
                        }
                        className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10"
                      >
                        {member.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {team.length === 0 ? (
                <div className="text-white/50">No admin team members yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
