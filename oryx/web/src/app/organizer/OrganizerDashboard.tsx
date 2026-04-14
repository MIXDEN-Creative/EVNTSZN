"use client";

import { useEffect, useState } from "react";
import { getCanonicalUrl } from "@/lib/domains";

type OrganizerEvent = {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  start_at: string;
  check_in_count: number;
};

type OrganizerDashboardProps = {
  canOperate: boolean;
  events: OrganizerEvent[];
};

type ManagedTicketType = {
  id: string;
  name: string;
  quantity_total: number;
  quantity_sold: number;
  availability_state?: string;
  is_active: boolean;
  visibility_mode: "visible" | "hidden";
};

export default function OrganizerDashboard({ canOperate, events }: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "create" | "manage">("queue");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  const [ticketTypes, setTicketTypes] = useState<ManagedTicketType[]>([]);
  const [operations, setOperations] = useState({ objective: "", runOfShow: "", opsNotes: "" });
  
  // ... (rest of states)
  
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    heroNote: "",
    venueName: "",
    city: "",
    state: "",
    startAt: "",
    endAt: "",
    capacity: "180",
    ticketTypeName: "General Access",
    ticketPriceCents: "3500",
    ticketQuantityTotal: "120",
    salesStartAt: "",
    salesEndAt: "",
    publishNow: true,
  });
  const [ticketForm, setTicketForm] = useState({
    name: "",
    quantityTotal: "60",
    priceCents: "1200",
    maxPerOrder: "4",
    salesStartAt: "",
    salesEndAt: "",
    visibilityMode: "visible" as "visible" | "hidden",
    isActive: true,
  });

  const stats = {
    total: events.length,
    published: events.filter((event) => event.status === "published").length,
    checkIns: events.reduce((total, event) => total + (event.check_in_count || 0), 0),
  };

  useEffect(() => {
    if (!selectedEventId) return;
    void loadManagedEvent(selectedEventId);
  }, [selectedEventId]);

  async function loadManagedEvent(eventId: string) {
    const res = await fetch(`/api/evntszn/events/${eventId}`, { cache: "no-store" });
    const data = (await res.json()) as Record<string, any>;
    if (!res.ok) throw new Error(data.error || "Could not load event detail.");
    setTicketTypes(data.ticketTypes || []);
    setOperations({
      objective: data.operations?.objective || "",
      runOfShow: data.operations?.run_of_show || "",
      opsNotes: data.operations?.ops_notes || "",
    });
  }

  async function activateOrganizerWorkspace() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/evntszn/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRole: "organizer" }),
      });

      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Could not activate organizer workspace.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not activate organizer workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/evntszn/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Could not create event.");

      window.location.href = `/events/${data.event.slug}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create event.");
    } finally {
      setLoading(false);
    }
  }

  async function updateEvent(eventId: string, patch: Record<string, unknown>) {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/evntszn/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Could not update event.");
      if (selectedEventId === eventId) {
        await loadManagedEvent(eventId);
      }
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update event.");
    } finally {
      setLoading(false);
    }
  }

  async function manageEvent(eventId: string) {
    setSelectedEventId(eventId);
    setActiveTab("manage");
    setLoading(true);
    setMessage("");
    try {
      await loadManagedEvent(eventId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load event detail.");
    } finally {
      setLoading(false);
    }
  }

  async function saveOperations() {
    if (!selectedEventId) return;
    await updateEvent(selectedEventId, { operations });
  }

  async function createTicketType(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/evntszn/events/${selectedEventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });
      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Could not create ticket type.");
      await loadManagedEvent(selectedEventId);
      setTicketForm({
        name: "",
        quantityTotal: "60",
        priceCents: "1200",
        maxPerOrder: "4",
        salesStartAt: "",
        salesEndAt: "",
        visibilityMode: "visible",
        isActive: true,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create ticket type.");
    } finally {
      setLoading(false);
    }
  }

  async function patchTicketType(ticketTypeId: string, patch: Record<string, unknown>) {
    if (!selectedEventId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/evntszn/events/${selectedEventId}/ticket-types`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId, ...patch }),
      });
      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Could not update ticket type.");
      await loadManagedEvent(selectedEventId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update ticket type.");
    } finally {
      setLoading(false);
    }
  }

  if (!canOperate) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-2xl font-bold">Organizer Access Required</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Activate your organizer profile to build events, manage ticket inventory, 
          and coordinate with venues and staffing teams.
        </p>
        <button
          onClick={activateOrganizerWorkspace}
          disabled={loading}
          className="mt-6 rounded-2xl bg-white px-5 py-3 font-bold text-black active:scale-95 disabled:opacity-50"
        >
          {loading ? "Activating..." : "Set up organizer access"}
        </button>
        {message ? <div className="mt-4 text-sm text-red-300">{message}</div> : null}
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "queue", label: "Event Queue" },
          { id: "create", label: "Create Event" },
          { id: "manage", label: "Manage Event" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === tab.id 
                ? "bg-white text-black" 
                : "border border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8">
        {activeTab === "queue" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.26em] text-[#A259FF]">Queue</div>
                  <h2 className="mt-3 text-3xl font-black">Live Event Timeline</h2>
                </div>
                <button 
                  onClick={() => setActiveTab("create")}
                  className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20"
                >
                  Add New
                </button>
              </div>
              
              <div className="mt-8 grid gap-4">
                {events.map((event) => (
                  <div key={event.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                          {event.status} · {event.visibility}
                        </div>
                        <div className="mt-2 text-2xl font-black">{event.title}</div>
                        <div className="mt-2 text-sm text-white/60">
                          {new Date(event.start_at).toLocaleString()} · {event.check_in_count || 0} checked in
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void manageEvent(event.id)}
                          className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black"
                        >
                          Manage
                        </button>
                        <a
                          href={getCanonicalUrl(`/scanner/${event.slug}`, "scanner", window.location.host)}
                          className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white"
                        >
                          Scanner
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Pulse</div>
                <div className="mt-6 space-y-4">
                  {[
                    ["Total Events", stats.total],
                    ["Published", stats.published],
                    ["Total Check-ins", stats.checkIns],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0">
                      <div className="text-sm text-white/60">{label}</div>
                      <div className="text-xl font-black">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === "create" && (
          <div className="mx-auto max-w-4xl">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.26em] text-[#A259FF]">Setup</div>
                  <h2 className="mt-3 text-4xl font-black">Build your next move</h2>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Track: {canOperate ? "Premium Operator" : "Independent"}
                </div>
              </div>
              <p className="mt-4 text-white/60">Set the identity, launch the tickets, and push it live.</p>
              
              <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Event classification</div>
                <div className="mt-2 text-sm text-white/70">
                  {canOperate 
                    ? "As an approved operator, your event will be created in the EVNTSZN network track with access to premium staffing and discovery tools."
                    : "Your event will be created as an independent production. You can manage ticketing and scanners here, but host-network discovery remains restricted until approval."}
                </div>
              </div>
              
              <form onSubmit={createEvent} className="mt-10 space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {[
                    ["title", "Event title"],
                    ["subtitle", "Subtitle"],
                    ["venueName", "Venue name"],
                    ["city", "City"],
                    ["state", "State"],
                    ["startAt", "Start ISO"],
                    ["endAt", "End ISO"],
                    ["capacity", "Capacity"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</label>
                      <input
                        value={form[key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-[#A259FF]/50"
                        required={["title", "venueName", "city", "state", "startAt", "endAt"].includes(key)}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-sm font-bold">Initial Ticket Release</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["ticketTypeName", "Ticket type"],
                      ["ticketPriceCents", "Price (cents)"],
                      ["ticketQuantityTotal", "Total quantity"],
                    ].map(([key, label]) => (
                      <input
                        key={key}
                        value={form[key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={label}
                        className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Public description"
                    className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none focus:border-[#A259FF]/50"
                  />
                  <label className="flex items-center gap-3 text-sm font-bold text-white/70">
                    <input
                      type="checkbox"
                      checked={form.publishNow}
                      onChange={(e) => setForm({ ...form, publishNow: e.target.checked })}
                      className="h-5 w-5 rounded border-white/10 bg-black/40"
                    />
                    Publish immediately
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full rounded-2xl bg-white font-black text-black active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Launch Event"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <section className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.26em] text-[#A259FF]">Controls</div>
                    <h2 className="mt-3 text-3xl font-black">{selectedEvent?.title || "Select Event"}</h2>
                  </div>
                  {selectedEvent && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => void updateEvent(selectedEvent.id, { status: "published", visibility: "published" })}
                        className="rounded-xl bg-[#A259FF] px-4 py-2 text-xs font-bold text-white"
                      >
                        Publish Live
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-10 space-y-8">
                  <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/40">Ticket Releases</div>
                    <div className="grid gap-4">
                      {ticketTypes.map((tt) => (
                        <div key={tt.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-5">
                          <div>
                            <div className="font-bold text-lg">{tt.name}</div>
                            <div className="text-xs text-white/50">{tt.quantity_sold} / {tt.quantity_total} sold</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => void patchTicketType(tt.id, { isActive: !tt.is_active })} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10">
                              {tt.is_active ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-[#A259FF]">Operations</div>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Run of Show</label>
                  <textarea 
                    value={operations.runOfShow} 
                    onChange={(e) => setOperations({ ...operations, runOfShow: e.target.value })} 
                    className="mt-2 min-h-[300px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm outline-none" 
                  />
                </div>
                <button 
                  onClick={() => void saveOperations()} 
                  disabled={loading}
                  className="w-full rounded-2xl bg-white py-4 font-black text-black active:scale-95"
                >
                  Save Ops
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
      
      {message ? (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-red-500/90 px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur">
          {message}
        </div>
      ) : null}
    </div>
  );
}
