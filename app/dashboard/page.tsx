"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Org = { id: string; name: string; created_at: string };
type Creator = {
  id: string;
  org_id: string;
  name: string;
  type: string;
  email: string | null;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState("artist");
  const [email, setEmail] = useState("");

  async function load() {
    setLoading(true);
    setError(null);

    const { data: orgData, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (orgErr) {
      setError(orgErr.message);
      setLoading(false);
      return;
    }

    setOrgs(orgData ?? []);

    const orgId = activeOrgId ?? orgData?.[0]?.id ?? null;
    setActiveOrgId(orgId);

    if (orgId) {
      const { data: creatorData, error: creatorErr } = await supabase
        .from("creators")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (creatorErr) {
        setError(creatorErr.message);
        setLoading(false);
        return;
      }

      setCreators((creatorData as Creator[]) ?? []);
    } else {
      setCreators([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function addCreator(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;

    setBusy(true);
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Name is required.");
      setBusy(false);
      return;
    }

    const { error: insErr } = await supabase.from("creators").insert({
      org_id: activeOrgId,
      name: cleanName,
      type,
      email: cleanEmail ? cleanEmail : null,
      status: "active",
    });

    if (insErr) {
      setError(insErr.message);
      setBusy(false);
      return;
    }

    setName("");
    setEmail("");
    await load();
    setBusy(false);
  }

  async function deleteCreator(id: string) {
    if (!confirm("Delete this creator?")) return;

    setBusy(true);
    setError(null);

    const { error: delErr } = await supabase.from("creators").delete().eq("id", id);

    if (delErr) {
      setError(delErr.message);
      setBusy(false);
      return;
    }

    await load();
    setBusy(false);
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MIXDEN Ops</h1>
            <p className="text-sm text-gray-600">Creators, products, events, orders.</p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-xl border px-3 py-2 text-sm" href="/events">Events</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/products">Products</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/orders">Orders</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/revenue">Revenue</a>
            <button onClick={signOut} className="rounded-xl border px-3 py-2 text-sm">Sign out</button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Error: {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6">Loading…</p>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Organizations</h2>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={activeOrgId ?? ""}
                  onChange={(e) => setActiveOrgId(e.target.value)}
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Active Org ID: <span className="font-mono">{activeOrgId}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add Creator</h2>
              </div>

              <form onSubmit={addCreator} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Name (required)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <select
                  className="rounded-xl border px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="artist">artist</option>
                  <option value="producer">producer</option>
                  <option value="songwriter">songwriter</option>
                  <option value="videographer">videographer</option>
                  <option value="photographer">photographer</option>
                  <option value="model">model</option>
                  <option value="influencer">influencer</option>
                  <option value="other">other</option>
                </select>
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                  {busy ? "Working..." : "Add"}
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Creators</h2>
                <button
                  onClick={load}
                  disabled={busy}
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {creators.length === 0 ? (
                  <p className="text-sm text-gray-600">No creators yet.</p>
                ) : (
                  creators.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-700">{c.type}</div>
                        <div className="text-xs text-gray-500">{c.email ?? "no email"}</div>
                      </div>
                      <button
                        onClick={() => deleteCreator(c.id)}
                        disabled={busy}
                        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
