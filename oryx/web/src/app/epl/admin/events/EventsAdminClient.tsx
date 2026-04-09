"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type ManagedEvent = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  status: string;
  visibility: string;
  city: string;
  state: string;
  start_at: string;
  end_at: string;
  banner_image_url: string | null;
  event_vertical: "evntszn" | "epl";
  event_class: "evntszn" | "independent_organizer" | "mml";
  event_collection: string | null;
  home_side_label: string | null;
  away_side_label: string | null;
  payout_account_label: string | null;
  scanner_status: string;
  venue_name: string | null;
  ticket_summary?: {
    total: number;
    active: number;
    scheduled: number;
    soldOut: number;
  };
};

type EventResponse = {
  ok?: boolean;
  error?: string;
  events?: ManagedEvent[];
};

type ManagedTicketType = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_order: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_active: boolean;
  visibility_mode: "visible" | "hidden";
  sort_order: number;
  availability_state?: string;
};

type EventDetailResponse = {
  ok?: boolean;
  error?: string;
  event?: ManagedEvent;
  ticketTypes?: ManagedTicketType[];
  operations?: {
    objective?: string | null;
    run_of_show?: string | null;
    ops_notes?: string | null;
  } | null;
};

const EMPTY_FORM = {
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
  ticketDescription: "",
  maxPerOrder: "4",
  salesStartAt: "",
  salesEndAt: "",
  publishNow: true,
  payoutAccountLabel: "ORYX Event Ops",
  bannerImageUrl: "",
  eventVertical: "evntszn" as "evntszn" | "epl",
  eventCollection: "",
  homeSideLabel: "",
  awaySideLabel: "",
  eventClass: "evntszn" as "evntszn" | "independent_organizer" | "mml",
};

export default function EventsAdminClient() {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [filter, setFilter] = useState<"all" | "evntszn" | "independent" | "epl">("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ManagedEvent | null>(null);
  const [ticketTypes, setTicketTypes] = useState<ManagedTicketType[]>([]);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    description: "",
    priceCents: "1200",
    quantityTotal: "80",
    maxPerOrder: "4",
    salesStartAt: "",
    salesEndAt: "",
    isActive: true,
    visibilityMode: "visible" as "visible" | "hidden",
    sortOrder: "100",
  });
  const [operationsForm, setOperationsForm] = useState({
    objective: "",
    runOfShow: "",
    opsNotes: "",
  });

  async function loadEvents(nextFilter = filter) {
    setLoading(true);
    setMessage(null);
    setMessageTone("neutral");
    try {
      const params = new URLSearchParams();
      if (nextFilter === "evntszn" || nextFilter === "epl") params.set("vertical", nextFilter);
      if (nextFilter === "independent") params.set("eventClass", "independent_organizer");
      const response = await fetch(`/api/evntszn/events?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as EventResponse;
      if (!response.ok) throw new Error(payload.error || "Could not load events.");
      setEvents(payload.events || []);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents(filter);
  }, [filter]);

  async function loadEventDetail(eventId: string) {
    const response = await fetch(`/api/evntszn/events/${eventId}`, { cache: "no-store" });
    const payload = (await response.json()) as EventDetailResponse;
    if (!response.ok) throw new Error(payload.error || "Could not load event detail.");
    setSelectedEvent(payload.event || null);
    setTicketTypes(payload.ticketTypes || []);
    setOperationsForm({
      objective: payload.operations?.objective || "",
      runOfShow: payload.operations?.run_of_show || "",
      opsNotes: payload.operations?.ops_notes || "",
    });
  }

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setMessageTone("neutral");
    try {
      const response = await fetch("/api/evntszn/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not create event.");
      setForm(EMPTY_FORM);
      await loadEvents(filter);
      setMessageTone("success");
      setMessage("Event created.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  }

  async function quickPatch(eventId: string, patch: Record<string, unknown>) {
    setSubmitting(true);
    setMessage(null);
    setMessageTone("neutral");
    try {
      const optimisticEvents = events.map((event) =>
        event.id === eventId ? { ...event, ...patch } : event,
      );
      setEvents(optimisticEvents);
      const response = await fetch(`/api/evntszn/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update event.");
      await loadEvents(filter);
      if (selectedEventId === eventId) {
        await loadEventDetail(eventId);
      }
      setMessageTone("success");
      if (patch.status === "published") {
        setMessage("Event published.");
      } else if (patch.status === "draft") {
        setMessage("Event moved back to draft.");
      } else {
        setMessage("Event updated.");
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update event.");
      await loadEvents(filter);
    } finally {
      setSubmitting(false);
    }
  }

  const counts = useMemo(
    () => ({
      total: events.length,
      evntszn: events.filter((item) => item.event_vertical === "evntszn" && item.event_class !== "independent_organizer").length,
      independent: events.filter((item) => item.event_class === "independent_organizer").length,
      epl: events.filter((item) => item.event_vertical === "epl").length,
      published: events.filter((item) => item.status === "published").length,
    }),
    [events],
  );

  async function selectEvent(eventId: string) {
    setSelectedEventId(eventId);
    setMessage(null);
    setMessageTone("neutral");
    try {
      await loadEventDetail(eventId);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not load event detail.");
    }
  }

  async function saveOperations() {
    if (!selectedEventId) return;
    await quickPatch(selectedEventId, {
      operations: operationsForm,
    });
  }

  async function createTicketType(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEventId) return;
    setSubmitting(true);
    setMessage(null);
    setMessageTone("neutral");
    try {
      const response = await fetch(`/api/evntszn/events/${selectedEventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not create ticket type.");
      setTicketForm({
        name: "",
        description: "",
        priceCents: "1200",
        quantityTotal: "80",
        maxPerOrder: "4",
        salesStartAt: "",
        salesEndAt: "",
        isActive: true,
        visibilityMode: "visible",
        sortOrder: "100",
      });
      await loadEventDetail(selectedEventId);
      await loadEvents(filter);
      setMessageTone("success");
      setMessage("Ticket type created.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not create ticket type.");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchTicketType(ticketTypeId: string, patch: Record<string, unknown>) {
    if (!selectedEventId) return;
    setSubmitting(true);
    setMessage(null);
    setMessageTone("neutral");
    try {
      const response = await fetch(`/api/evntszn/events/${selectedEventId}/ticket-types`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId, ...patch }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update ticket type.");
      await loadEventDetail(selectedEventId);
      await loadEvents(filter);
      setMessageTone("success");
      setMessage("Ticket settings updated.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update ticket type.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Event desk</div>
            <h1 className="ev-title">Create events, release tickets, and keep each live show ready to publish.</h1>
            <p className="ev-subtitle">
              Use the left side to launch the next event. Use the right side to manage live inventory, publish state, and run of show for anything already on the calendar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Total events", counts.total],
              ["EVNTSZN", counts.evntszn],
              ["Independent", counts.independent],
              ["EPL", counts.epl],
              ["Published", counts.published],
            ].map(([label, value]) => (
              <div key={String(label)} className="ev-meta-card">
                <div className="ev-meta-label">{label}</div>
                <div className="ev-meta-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {message ? (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              messageTone === "error"
                ? "border-red-400/20 bg-red-500/10 text-red-100"
                : messageTone === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-black/30 text-white/75"
            }`}
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="ev-panel">
          <div className="ev-section-kicker">Create event</div>
          <div className="mt-3 text-2xl font-bold">Launch the next event</div>
          <p className="mt-2 text-sm text-white/60">
            Start with event identity, then set ticket defaults. League-specific fields stay hidden until you switch the vertical.
          </p>
          <form onSubmit={createEvent} className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 1</div>
              <div className="mt-2 text-lg font-semibold text-white">Identity</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-white/72">
                  <span>Event vertical</span>
                  <select
                    value={form.eventVertical}
                    onChange={(event) =>
                      setForm({ ...form, eventVertical: event.target.value as "evntszn" | "epl" })
                    }
                    className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                  >
                    <option value="evntszn">EVNTSZN</option>
                    <option value="epl">EPL</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-white/72">
                  <span>Collection label</span>
                  <input
                    value={form.eventCollection}
                    onChange={(event) => setForm({ ...form, eventCollection: event.target.value })}
                    placeholder="nightlife, premium-series, epl-season-1"
                    className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                  />
                </label>
              </div>

              {form.eventVertical === "evntszn" ? (
                <label className="mt-4 grid gap-2 text-sm text-white/72">
                  <span>Event class</span>
                  <select
                    value={form.eventClass}
                    onChange={(event) =>
                      setForm({ ...form, eventClass: event.target.value as "evntszn" | "independent_organizer" | "mml" })
                    }
                    className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                  >
                    <option value="evntszn">EVNTSZN native</option>
                    <option value="independent_organizer">Independent organizer</option>
                    <option value="mml">MML foundation</option>
                  </select>
                </label>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["title", "Event title"],
                  ["subtitle", "Subtitle"],
                  ["venueName", "Venue name"],
                  ["city", "City"],
                  ["state", "State"],
                  ["startAt", "Start ISO datetime"],
                  ["endAt", "End ISO datetime"],
                  ["bannerImageUrl", "Banner image URL"],
                ].map(([key, label]) => (
                  <input
                    key={key}
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    placeholder={label}
                    className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                    required={["title", "venueName", "city", "state", "startAt", "endAt"].includes(key)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 2</div>
              <div className="mt-2 text-lg font-semibold text-white">Default ticket setup</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["payoutAccountLabel", "Payout account label"],
                  ["capacity", "Capacity"],
                  ["ticketTypeName", "Ticket type"],
                  ["ticketPriceCents", "Ticket price cents"],
                  ["ticketQuantityTotal", "Ticket quantity"],
                  ["maxPerOrder", "Max per order"],
                  ["salesStartAt", "Ticket sales start ISO"],
                  ["salesEndAt", "Ticket sales end ISO"],
                ].map(([key, label]) => (
                  <input
                    key={key}
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    placeholder={label}
                    className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                  />
                ))}
              </div>
            </div>

            {form.eventVertical === "epl" ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">Step 3</div>
                <div className="mt-2 text-lg font-semibold text-white">League matchup labels</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={form.homeSideLabel}
                  onChange={(event) => setForm({ ...form, homeSideLabel: event.target.value })}
                  placeholder="Home side label"
                  className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                />
                <input
                  value={form.awaySideLabel}
                  onChange={(event) => setForm({ ...form, awaySideLabel: event.target.value })}
                  placeholder="Away side label"
                  className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
                />
                </div>
              </div>
            ) : null}

            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Operational description"
              className="min-h-[120px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />
            <textarea
              value={form.heroNote}
              onChange={(event) => setForm({ ...form, heroNote: event.target.value })}
              placeholder="Hero note"
              className="min-h-[100px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />

            <label className="inline-flex items-center gap-3 text-sm text-white/72">
              <input
                type="checkbox"
                checked={form.publishNow}
                onChange={(event) => setForm({ ...form, publishNow: event.target.checked })}
              />
              Publish immediately into public discovery
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-white px-5 py-4 font-semibold text-black disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create event"}
            </button>
          </form>
        </section>

        <section className="ev-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">Event roster</div>
              <div className="mt-2 text-2xl font-bold">Published, draft, and league-ready events</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "evntszn", "independent", "epl"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.04] text-white/72 hover:bg-white/[0.08]"
                  }`}
                >
                  {value === "all" ? "All" : value === "independent" ? "Independent" : value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`event-skeleton-${index}`} className="animate-pulse rounded-[24px] border border-white/10 bg-black/25 p-5">
                  <div className="h-3 w-40 rounded bg-white/10" />
                  <div className="mt-4 h-6 w-56 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-64 rounded bg-white/10" />
                </div>
              ))
            ) : null}
            {!loading && !events.length ? (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-5 text-white/58">
                No events in this filter yet. Create the next EVNTSZN or EPL event from the panel.
              </div>
            ) : null}

            {events.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-black/25 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      <span>{event.event_vertical.toUpperCase()}</span>
                      <span>{event.event_class.replace(/_/g, " ")}</span>
                      <span>{event.status}</span>
                      <span>{event.visibility}</span>
                      <span>
                        {event.city}, {event.state}
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{event.title}</div>
                    <div className="mt-2 text-sm text-white/62">
                      {event.venue_name || "Venue pending"} · {new Date(event.start_at).toLocaleString()}
                    </div>
                    {event.event_collection ? (
                      <div className="mt-3 text-sm text-[#d5c2ff]">Collection: {event.event_collection}</div>
                    ) : null}
                    {event.ticket_summary ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/62">
                        <span>{event.ticket_summary.total} ticket types</span>
                        <span>{event.ticket_summary.active} live</span>
                        <span>{event.ticket_summary.scheduled} upcoming</span>
                        <span>{event.ticket_summary.soldOut} sold out</span>
                      </div>
                    ) : null}
                    {event.event_vertical === "epl" && (event.home_side_label || event.away_side_label) ? (
                      <div className="mt-2 text-sm text-white/62">
                        {event.home_side_label || "Home"} vs {event.away_side_label || "Away"}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a href={`/events/${event.slug}`} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/78">
                      Open event
                    </a>
                    <button
                      type="button"
                      onClick={() => void selectEvent(event.id)}
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/78"
                    >
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => quickPatch(event.id, { status: "published", visibility: "published" })}
                      className="rounded-xl border border-[#A259FF]/30 bg-[#A259FF]/10 px-3 py-2 text-sm text-[#e5daff]"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => quickPatch(event.id, { status: "draft", visibility: "private_preview" })}
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/78"
                    >
                      Revert to draft
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="ev-panel">
          <div className="ev-section-kicker">Event operations</div>
          <div className="mt-2 text-2xl font-bold">
            {selectedEvent ? selectedEvent.title : "Select an event to manage ticketing and run of show."}
          </div>

          {!selectedEvent ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-5 text-white/58">
              Pick an event from the roster to manage ticket release timing, visibility, publish state, and event operations notes.
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">Run of show</div>
                <div className="mt-4 grid gap-4">
                  <textarea
                    value={operationsForm.objective}
                    onChange={(event) => setOperationsForm({ ...operationsForm, objective: event.target.value })}
                    placeholder="Objective"
                    className="min-h-[100px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                  <textarea
                    value={operationsForm.runOfShow}
                    onChange={(event) => setOperationsForm({ ...operationsForm, runOfShow: event.target.value })}
                    placeholder="Run of show"
                    className="min-h-[220px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                  <textarea
                    value={operationsForm.opsNotes}
                    onChange={(event) => setOperationsForm({ ...operationsForm, opsNotes: event.target.value })}
                    placeholder="Operational notes"
                    className="min-h-[100px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  />
                  <button type="button" onClick={() => void saveOperations()} className="rounded-2xl bg-white px-5 py-4 font-semibold text-black">
                    Save event operations
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold text-white">Ticket types</div>
                <div className="mt-4 grid gap-3">
                  {ticketTypes.map((ticketType) => (
                    <div key={ticketType.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white">{ticketType.name}</div>
                          <div className="mt-1 text-sm text-white/62">
                            ${(ticketType.price_cents / 100).toFixed(2)} · {ticketType.quantity_sold}/{ticketType.quantity_total} sold · {ticketType.availability_state}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void patchTicketType(ticketType.id, { isActive: !ticketType.is_active })} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/78">
                            {ticketType.is_active ? "Turn off" : "Turn on"}
                          </button>
                          <button type="button" onClick={() => void patchTicketType(ticketType.id, { visibilityMode: ticketType.visibility_mode === "hidden" ? "visible" : "hidden" })} className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/78">
                            {ticketType.visibility_mode === "hidden" ? "Show" : "Hide"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={createTicketType} className="mt-6 grid gap-4 border-t border-white/10 pt-5">
                  <div className="text-sm font-semibold text-white">Add ticket type</div>
                  <input value={ticketForm.name} onChange={(event) => setTicketForm({ ...ticketForm, name: event.target.value })} placeholder="Ticket name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" required />
                  <textarea value={ticketForm.description} onChange={(event) => setTicketForm({ ...ticketForm, description: event.target.value })} placeholder="Description" className="min-h-[90px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" />
                  <div className="grid gap-4 md:grid-cols-3">
                    <input value={ticketForm.priceCents} onChange={(event) => setTicketForm({ ...ticketForm, priceCents: event.target.value })} placeholder="Price cents" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.quantityTotal} onChange={(event) => setTicketForm({ ...ticketForm, quantityTotal: event.target.value })} placeholder="Inventory" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.maxPerOrder} onChange={(event) => setTicketForm({ ...ticketForm, maxPerOrder: event.target.value })} placeholder="Max per order" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <input value={ticketForm.salesStartAt} onChange={(event) => setTicketForm({ ...ticketForm, salesStartAt: event.target.value })} placeholder="Sales start ISO" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.salesEndAt} onChange={(event) => setTicketForm({ ...ticketForm, salesEndAt: event.target.value })} placeholder="Sales end ISO" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                    <input value={ticketForm.sortOrder} onChange={(event) => setTicketForm({ ...ticketForm, sortOrder: event.target.value })} placeholder="Sort order" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select value={ticketForm.visibilityMode} onChange={(event) => setTicketForm({ ...ticketForm, visibilityMode: event.target.value as "visible" | "hidden" })} className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none">
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                    <label className="inline-flex items-center gap-3 text-sm text-white/72">
                      <input type="checkbox" checked={ticketForm.isActive} onChange={(event) => setTicketForm({ ...ticketForm, isActive: event.target.checked })} />
                      Ticket type is active
                    </label>
                  </div>
                  <button type="submit" disabled={submitting} className="rounded-2xl bg-white px-5 py-4 font-semibold text-black disabled:opacity-50">
                    Add ticket type
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
