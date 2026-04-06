"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Org = { id: string; name: string; created_at: string };
type EventRow = {
  id: string;
  org_id: string | null;
  name: string | null;
  type: string | null;
  start_at: string | null;
  end_at: string | null;
  location_name: string | null;
  location_address: string | null;
  capacity: number | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
};

export default function EventsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [type, setType] = useState("mixer");
  const [startAt, setStartAt] = useState(""); // yyyy-mm-ddThh:mm
  const [locationName, setLocationName] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [status, setStatus] = useState("draft");

  async function load(orgIdOverride?: string) {
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

    const list = (orgData as Org[]) ?? [];
    setOrgs(list);

    const orgId = orgIdOverride || activeOrgId || list?.[0]?.id || "";
    setActiveOrgId(orgId);

    if (!orgId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("org_id", orgId)
      .order("start_at", { ascending: false });

    if (error) {
      setError(error.message);
      setEvents([]);
      setLoading(false);
      return;
    }

    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;

    setBusy(true);
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Event name is required.");
      setBusy(false);
      return;
    }

    if (!startAt) {
      setError("Start date/time is required.");
      setBusy(false);
      return;
    }

    const cap = capacity.trim() ? Number(capacity) : null;
    if (cap !== null && (!Number.isFinite(cap) || cap < 1)) {
      setError("Capacity must be a number >= 1 (or leave blank).");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("events").insert({
      org_id: activeOrgId,
      name: cleanName,
      type,
      start_at: new Date(startAt).toISOString(),
      location_name: locationName.trim() ? locationName.trim() : null,
      capacity: cap,
      status,
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    setName("");
    setType("mixer");
    setStartAt("");
    setLocationName("");
    setCapacity("100");
    setStatus("draft");

    await load(activeOrgId);
    setBusy(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;

    setBusy(true);
    setError(null);

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    await load(activeOrgId);
    setBusy(false);
  }

  function fmt(d?: string | null) {
    if (!d) return "No date";
    return new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Events</h1>
            <p className="text-sm text-gray-600">Mixers, residencies, showcases, workshops.</p>
          </div>
          <div className="flex gap-2">
            <a className="rounded-xl border px-3 py-2 text-sm" href="/dashboard">Dashboard</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/orders">Orders</a>
            <a className="rounded-xl border px-3 py-2 text-sm" href="/products">Products</a>
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
                <h2 className="text-lg font-semibold">Organization</h2>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={activeOrgId}
                  onChange={(e) => load(e.target.value)}
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <h2 className="text-lg font-semibold">Add Event</h2>

              <form onSubmit={addEvent} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                <input
                  className="rounded-xl border px-3 py-2 md:col-span-2"
                  placeholder="Event name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <select className="rounded-xl border px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="mixer">mixer</option>
                  <option value="residency">residency</option>
                  <option value="showcase">showcase</option>
                  <option value="workshop">workshop</option>
                </select>

                <input
                  className="rounded-xl border px-3 py-2"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Location name"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />

                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />

                <select className="rounded-xl border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">draft</option>
                  <option value="live">live</option>
                  <option value="done">done</option>
                  <option value="canceled">canceled</option>
                </select>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60 md:col-span-6"
                >
                  {busy ? "Working..." : "Add Event"}
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Event List</h2>
                <button onClick={() => load(activeOrgId)} disabled={busy} className="rounded-xl border px-3 py-2 text-sm">
                  Refresh
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-gray-600">No events yet.</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div>
                        <div className="font-medium">{ev.name ?? "Untitled event"}</div>
                        <div className="text-sm text-gray-700">
                          {(ev.type ?? "mixer")} · {(ev.status ?? "draft")} · {fmt(ev.start_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(ev.location_name ?? "No location")} · Capacity: {ev.capacity ?? "—"}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(ev.id)}
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
