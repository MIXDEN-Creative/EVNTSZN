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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  const [ticketTypes, setTicketTypes] = useState<ManagedTicketType[]>([]);
  const [operations, setOperations] = useState({ objective: "", runOfShow: "", opsNotes: "" });
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
        <h2 className="text-2xl font-semibold">Activate organizer mode</h2>
        <p className="mt-3 max-w-2xl text-white/65">
          Turn this workspace into the EVNTSZN organizer operating system for event buildout,
          ticket inventory, scanner links, and venue coordination.
        </p>
        <button
          onClick={activateOrganizerWorkspace}
          disabled={loading}
          className="mt-6 rounded-2xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Activating..." : "Activate organizer workspace"}
        </button>
        {message ? <div className="mt-4 text-sm text-red-300">{message}</div> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.8fr_1fr_0.95fr]">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.26em] text-[#A259FF]">Create event</p>
        <h2 className="mt-3 text-3xl font-semibold">Launch a premium ticketed experience</h2>
        <form onSubmit={createEvent} className="mt-6 grid gap-4">
          {[
            ["title", "Event title"],
            ["subtitle", "Subtitle"],
            ["venueName", "Venue name"],
            ["city", "City"],
            ["state", "State"],
            ["startAt", "Start ISO datetime"],
            ["endAt", "End ISO datetime"],
            ["capacity", "Capacity"],
            ["ticketTypeName", "Ticket type"],
            ["ticketPriceCents", "Ticket price cents"],
            ["ticketQuantityTotal", "Ticket quantity"],
            ["salesStartAt", "Ticket sales start ISO"],
            ["salesEndAt", "Ticket sales end ISO"],
          ].map(([key, label]) => (
            <input
              key={key}
              value={form[key as keyof typeof form] as string}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={label}
              className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
              required={["title", "venueName", "city", "state", "startAt", "endAt"].includes(key)}
            />
          ))}
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Operational description"
            className="min-h-[140px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />
          <textarea
            value={form.heroNote}
            onChange={(e) => setForm({ ...form, heroNote: e.target.value })}
            placeholder="Premium hero note"
            className="min-h-[120px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />
          <label className="inline-flex items-center gap-3 text-sm text-white/72">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm({ ...form, publishNow: e.target.checked })}
            />
            Publish immediately to the public events inventory
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-white px-5 py-4 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create event"}
          </button>
        </form>
        {message ? <div className="mt-4 text-sm text-red-300">{message}</div> : null}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.26em] text-[#A259FF]">Control tower</p>
        <h2 className="mt-3 text-3xl font-semibold">Organizer command center</h2>
        <div className="mt-6 grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                    {event.status} · {event.visibility}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{event.title}</div>
                  <div className="mt-2 text-sm text-white/60">
                    {new Date(event.start_at).toLocaleString()} · check-ins: {event.check_in_count || 0}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/events/${event.slug}`} className="rounded-xl border border-white/15 px-3 py-2 text-sm">
                    Open event
                  </a>
                  <a
                    href={getCanonicalUrl(`/scanner/${event.slug}`, "scanner", window.location.host)}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm"
                  >
                    Scanner
                  </a>
                  <button
                    onClick={() => void manageEvent(event.id)}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => void updateEvent(event.id, { status: "published", visibility: "published" })}
                    className="rounded-xl border border-[#A259FF]/30 bg-[#A259FF]/10 px-3 py-2 text-sm text-[#dfd0ff]"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!events.length ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/30 p-5 text-white/58">
              No organizer events yet. Create the first EVNTSZN production event from the panel.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.26em] text-[#A259FF]">Ticketing</p>
          <h2 className="mt-3 text-3xl font-semibold">Live inventory controls</h2>
          {!selectedEventId ? (
            <div className="mt-6 text-sm text-white/60">Select one of your events to manage ticket releases.</div>
          ) : (
            <div className="mt-6 grid gap-4">
              {ticketTypes.map((ticketType) => (
                <div key={ticketType.id} className="rounded-[24px] border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">{ticketType.name}</div>
                      <div className="mt-1 text-sm text-white/60">
                        {ticketType.quantity_sold}/{ticketType.quantity_total} sold · {ticketType.availability_state}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => void patchTicketType(ticketType.id, { isActive: !ticketType.is_active })} className="rounded-xl border border-white/15 px-3 py-2 text-sm">
                        {ticketType.is_active ? "Turn off" : "Turn on"}
                      </button>
                      <button onClick={() => void patchTicketType(ticketType.id, { visibilityMode: ticketType.visibility_mode === "hidden" ? "visible" : "hidden" })} className="rounded-xl border border-white/15 px-3 py-2 text-sm">
                        {ticketType.visibility_mode === "hidden" ? "Show" : "Hide"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <form onSubmit={createTicketType} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-semibold text-white">Add ticket type</div>
                <div className="mt-4 grid gap-3">
                  <input value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} placeholder="Ticket name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" required />
                  <div className="grid gap-3 md:grid-cols-3">
                    <input value={ticketForm.priceCents} onChange={(e) => setTicketForm({ ...ticketForm, priceCents: e.target.value })} placeholder="Price cents" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.quantityTotal} onChange={(e) => setTicketForm({ ...ticketForm, quantityTotal: e.target.value })} placeholder="Inventory" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.maxPerOrder} onChange={(e) => setTicketForm({ ...ticketForm, maxPerOrder: e.target.value })} placeholder="Max per order" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={ticketForm.salesStartAt} onChange={(e) => setTicketForm({ ...ticketForm, salesStartAt: e.target.value })} placeholder="Sales start ISO" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.salesEndAt} onChange={(e) => setTicketForm({ ...ticketForm, salesEndAt: e.target.value })} placeholder="Sales end ISO" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  </div>
                  <button type="submit" disabled={loading} className="rounded-2xl bg-white px-5 py-4 font-semibold text-black disabled:opacity-50">
                    Add ticket type
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.26em] text-[#A259FF]">Event operations</p>
          <h2 className="mt-3 text-3xl font-semibold">Run of show</h2>
          {!selectedEventId ? (
            <div className="mt-6 text-sm text-white/60">Select one of your events to manage event operations.</div>
          ) : (
            <div className="mt-6 grid gap-4">
              <textarea value={operations.objective} onChange={(e) => setOperations({ ...operations, objective: e.target.value })} placeholder="Objective" className="min-h-[100px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" />
              <textarea value={operations.runOfShow} onChange={(e) => setOperations({ ...operations, runOfShow: e.target.value })} placeholder="Run of show" className="min-h-[220px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" />
              <textarea value={operations.opsNotes} onChange={(e) => setOperations({ ...operations, opsNotes: e.target.value })} placeholder="Operational notes" className="min-h-[100px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" />
              <button onClick={() => void saveOperations()} disabled={loading} className="rounded-2xl bg-white px-5 py-4 font-semibold text-black disabled:opacity-50">
                Save event operations
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
