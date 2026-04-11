"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { INTERNAL_CITY_OPTIONS, getCityStateCode } from "@/lib/city-options";

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
  revenue_profile?: {
    id: string;
    event_type: "host" | "city_leader" | "independent";
    city_office_id: string | null;
    is_independent: boolean;
    independent_origin: "city" | "hq" | null;
  } | null;
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
  revenue?: {
    profile?: {
      id: string;
      event_type: "host" | "city_leader" | "independent";
      city_office_id: string | null;
      is_independent: boolean;
      independent_origin: "city" | "hq" | null;
    } | null;
    totals?: {
      grossTicketRevenue: number;
      platformFeeTotal: number;
      netRevenueTotal: number;
      hostShare: number;
      cityLeaderShare: number;
      cityOfficeShare: number;
      hqShare: number;
      overrideTotal: number;
    };
    auditStatus?: "balanced" | "unbalanced" | "pending";
    ledgerStatuses?: {
      pending: number;
      locked: number;
      void: number;
    };
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
  revenueEventType: "host" as "host" | "city_leader" | "independent",
  cityOfficeId: "",
  independentOrigin: "city" as "city" | "hq",
};

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

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
  const [revenueSummary, setRevenueSummary] = useState<EventDetailResponse["revenue"]>(null);
  const [officeOptions, setOfficeOptions] = useState<Array<{ id: string; officeName: string; city: string; officeStatus: string }>>([]);
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
      if (!response.ok) throw new Error(payload.error || "Could not load events roster.");
      setEvents(payload.events || []);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not load events roster.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents(filter);
  }, [filter]);

  useEffect(() => {
    fetch("/api/admin/city-office", { cache: "no-store" })
      .then(async (response) => (await response.json()) as { offices?: Array<{ id: string; officeName: string; city: string; officeStatus: string }> })
      .then((payload) => setOfficeOptions(payload.offices || []))
      .catch(() => setOfficeOptions([]));
  }, []);

  async function loadEventDetail(eventId: string) {
    const response = await fetch(`/api/evntszn/events/${eventId}`, { cache: "no-store" });
    const payload = (await response.json()) as EventDetailResponse;
    if (!response.ok) throw new Error(payload.error || "Could not load event detail.");
    setSelectedEvent(payload.event || null);
    setTicketTypes(payload.ticketTypes || []);
    setRevenueSummary(payload.revenue || null);
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
        body: JSON.stringify({
          ...form,
          startAt: toIsoDateTime(form.startAt),
          endAt: toIsoDateTime(form.endAt),
          salesStartAt: toIsoDateTime(form.salesStartAt),
          salesEndAt: toIsoDateTime(form.salesEndAt),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not create event shell.");
      setForm(EMPTY_FORM);
      await loadEvents(filter);
      setMessageTone("success");
      setMessage("Event shell created.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not create event shell.");
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
        setMessage("Event published to discovery.");
      } else if (patch.status === "draft") {
        setMessage("Event reverted to draft.");
      } else {
        setMessage("Event state updated.");
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

  const filteredOfficeOptions = useMemo(() => {
    if (!form.city) return officeOptions;
    return officeOptions.filter((office) => office.city === form.city);
  }, [form.city, officeOptions]);

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
        body: JSON.stringify({
          ...ticketForm,
          salesStartAt: toIsoDateTime(ticketForm.salesStartAt),
          salesEndAt: toIsoDateTime(ticketForm.salesEndAt),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not create ticket release.");
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
      setMessage("Ticket release created.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not create ticket release.");
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
      if (!response.ok) throw new Error(payload.error || "Could not update ticket settings.");
      await loadEventDetail(selectedEventId);
      await loadEvents(filter);
      setMessageTone("success");
      setMessage("Ticket settings updated.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not update ticket settings.");
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
            <h1 className="ev-title">Manage events, release tickets, and maintain live inventory.</h1>
            <p className="ev-subtitle">
              Configure event identity and revenue models from the left. Manage rosters, publish states, and run of show detail from the right.
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
            className={`mt-4 rounded-2xl border p-4 text-sm font-medium ${
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

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.1fr] 2xl:grid-cols-[0.85fr_1.15fr]">
        <section className="ev-panel flex flex-col overflow-hidden border-white/10">
          <div className="p-6 md:p-8">
            <div className="ev-section-kicker">Create shell</div>
            <div className="mt-1 text-3xl font-bold tracking-tight">Launch new event</div>
            <p className="mt-2 text-base text-white/60">
              Build the core event record. Define identity, attach the revenue model, and set initial ticket defaults.
            </p>
          </div>
          
          <form onSubmit={createEvent} className="grid flex-1 gap-px border-t border-white/10 bg-white/5">
            <div className="bg-black/40 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#caa7ff]/20 text-[11px] font-bold text-[#caa7ff]">1</div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Identity</div>
              </div>
              
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>Vertical</span>
                  <select
                    value={form.eventVertical}
                    onChange={(event) =>
                      setForm({ ...form, eventVertical: event.target.value as "evntszn" | "epl" })
                    }
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                  >
                    <option value="evntszn">EVNTSZN</option>
                    <option value="epl">EPL</option>
                  </select>
                </label>
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>Collection</span>
                  <input
                    value={form.eventCollection}
                    onChange={(event) => setForm({ ...form, eventCollection: event.target.value })}
                    placeholder="e.g. nightlife, series-1"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                  />
                </label>

                {form.eventVertical === "evntszn" ? (
                  <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                    <span>Operational Class</span>
                    <select
                      value={form.eventClass}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          eventClass: event.target.value as "evntszn" | "independent_organizer" | "mml",
                          revenueEventType:
                            event.target.value === "independent_organizer" ? "independent" : form.revenueEventType,
                        })
                      }
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                    >
                      <option value="evntszn">Native</option>
                      <option value="independent_organizer">Independent</option>
                      <option value="mml">MML</option>
                    </select>
                  </label>
                ) : <div className="hidden 2xl:block" />}

                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 md:col-span-2 lg:col-span-3 xl:col-span-2 2xl:col-span-3">
                  <span>Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Official event title"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    required
                  />
                </label>
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 md:col-span-2 lg:col-span-3 xl:col-span-2 2xl:col-span-3">
                  <span>Subtitle</span>
                  <input
                    value={form.subtitle}
                    onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                    placeholder="Secondary line or theme"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                  />
                </label>
              </div>
            </div>

            <div className="bg-black/40 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#caa7ff]/20 text-[11px] font-bold text-[#caa7ff]">2</div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Schedule & Location</div>
              </div>
              
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 md:col-span-2 lg:col-span-3 xl:col-span-2 2xl:col-span-3">
                  <span>Venue</span>
                  <input
                    value={form.venueName}
                    onChange={(event) => setForm({ ...form, venueName: event.target.value })}
                    placeholder="Venue name"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    required
                  />
                </label>
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>City</span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                        state: getCityStateCode(event.target.value) || current.state,
                      }))
                    }
                    placeholder="City"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    required
                    list="event-city-options"
                  />
                </label>
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>State</span>
                  <input
                    value={form.state}
                    onChange={(event) => setForm({ ...form, state: event.target.value })}
                    placeholder="State"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    required
                  />
                </label>
                <div className="hidden lg:block xl:hidden 2xl:block" />
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>Start Time</span>
                  <input
                    value={toDateTimeLocalValue(form.startAt)}
                    onChange={(event) => setForm({ ...form, startAt: event.target.value })}
                    type="datetime-local"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                    required
                  />
                </label>
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>End Time</span>
                  <input
                    value={toDateTimeLocalValue(form.endAt)}
                    onChange={(event) => setForm({ ...form, endAt: event.target.value })}
                    type="datetime-local"
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="bg-black/40 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#caa7ff]/20 text-[11px] font-bold text-[#caa7ff]">3</div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Revenue & Tickets</div>
              </div>
              
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>Revenue Profile</span>
                  <select
                    value={form.revenueEventType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        revenueEventType: event.target.value as "host" | "city_leader" | "independent",
                      })
                    }
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                  >
                    <option value="host">Host Event</option>
                    <option value="city_leader">City Leader Event</option>
                    <option value="independent">Independent Organizer</option>
                  </select>
                </label>
                {(form.revenueEventType !== "independent" || form.independentOrigin === "city") ? (
                  <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 md:col-span-1 lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                    <span>City Office</span>
                    <select
                      value={form.cityOfficeId}
                      onChange={(event) => setForm({ ...form, cityOfficeId: event.target.value })}
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                    >
                      <option value="">No office attached</option>
                      {filteredOfficeOptions.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.officeName}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40 md:col-span-1 lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                    <span>Origin</span>
                    <select
                      value={form.independentOrigin}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          independentOrigin: event.target.value as "city" | "hq",
                        })
                      }
                      className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-[#caa7ff]/40"
                    >
                      <option value="city">City Origin</option>
                      <option value="hq">HQ Origin</option>
                    </select>
                  </label>
                )}

                <div className="mt-2 grid gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:col-span-2 lg:col-span-3 xl:col-span-2 2xl:col-span-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">First Ticket Release</div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                      <span>Label</span>
                      <input value={form.ticketTypeName} onChange={(event) => setForm({ ...form, ticketTypeName: event.target.value })} placeholder="General Access" className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
                    </label>
                    <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                      <span>Price (Cents)</span>
                      <input value={form.ticketPriceCents} onChange={(event) => setForm({ ...form, ticketPriceCents: event.target.value })} placeholder="3500" className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
                    </label>
                    <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                      <span>Total Inventory</span>
                      <input value={form.ticketQuantityTotal} onChange={(event) => setForm({ ...form, ticketQuantityTotal: event.target.value })} placeholder="100" className="h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#caa7ff]/20 text-[11px] font-bold text-[#caa7ff]">4</div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Public Content</div>
              </div>
              
              <div className="mt-8 grid gap-6">
                <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                  <span>Banner Image URL</span>
                  <input
                    value={form.bannerImageUrl}
                    onChange={(event) => setForm({ ...form, bannerImageUrl: event.target.value })}
                    placeholder="https://..."
                    className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                  />
                </label>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                    <span>Hero Note</span>
                    <textarea
                      value={form.heroNote}
                      onChange={(event) => setForm({ ...form, heroNote: event.target.value })}
                      placeholder="Concise highlight for cards"
                      className="h-32 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    />
                  </label>
                  <label className="grid gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                    <span>Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      placeholder="Full event summary for attendees"
                      className="h-32 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#caa7ff]/40"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-white/72">
                  <input
                    type="checkbox"
                    checked={form.publishNow}
                    onChange={(event) => setForm({ ...form, publishNow: event.target.checked })}
                    className="h-5 w-5 rounded-lg border-white/10 bg-white/5"
                  />
                  <span>Publish shell to discovery immediately</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-white px-8 py-4 font-bold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? "Launching..." : "Launch event shell"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-8">
          <section className="ev-panel p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="ev-section-kicker">Event roster</div>
                <div className="mt-1 text-3xl font-bold tracking-tight">Manage inventory</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "evntszn", "independent", "epl"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition ${
                      filter === value
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                    }`}
                  >
                    {value === "all" ? "All" : value === "independent" ? "Indie" : value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`event-skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="h-3 w-32 rounded bg-white/5" />
                    <div className="mt-3 h-5 w-48 rounded bg-white/5" />
                  </div>
                ))
              ) : null}
              
              {!loading && !events.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center text-sm text-white/40">
                  No events found. Launch a new shell from the panel.
                </div>
              ) : null}

              {events.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  className={`group rounded-2xl border transition-all ${
                    selectedEventId === event.id 
                      ? "border-[#caa7ff]/40 bg-[#caa7ff]/5" 
                      : "border-white/5 bg-black/20 hover:border-white/10"
                  } p-5`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <span className={`rounded-md px-1.5 py-0.5 ${event.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/60"}`}>
                          {event.status}
                        </span>
                        <span className="text-white/20">/</span>
                        <span>{event.event_vertical}</span>
                        <span className="text-white/20">/</span>
                        <span>{event.city}</span>
                      </div>
                      <div className="mt-2 text-xl font-bold text-white">{event.title}</div>
                      <div className="mt-1 text-sm text-white/50">
                        {event.venue_name || "Venue pending"} · {new Date(event.start_at).toLocaleDateString()}
                      </div>
                      
                      {event.ticket_summary ? (
                        <div className="mt-4 flex flex-wrap gap-4 border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-widest">
                          <div className="flex flex-col gap-1">
                            <span className="text-white/30">Live</span>
                            <span className="text-emerald-400">{event.ticket_summary.active}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-white/30">Sold</span>
                            <span className="text-white/70">{event.ticket_summary.soldOut}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-white/30">Total</span>
                            <span className="text-white/70">{event.ticket_summary.total}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:justify-start">
                      <button
                        type="button"
                        onClick={() => void selectEvent(event.id)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                          selectedEventId === event.id
                            ? "bg-[#caa7ff] text-black"
                            : "bg-white/5 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {selectedEventId === event.id ? "Editing" : "Open Desk"}
                      </button>
                      <div className="flex gap-2">
                        {event.status !== "published" ? (
                          <button
                            type="button"
                            onClick={() => quickPatch(event.id, { status: "published", visibility: "published" })}
                            className="rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => quickPatch(event.id, { status: "draft", visibility: "private_preview" })}
                            className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:bg-white/10"
                          >
                            Unpublish
                          </button>
                        )}
                        <a 
                          href={`/events/${event.slug}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10"
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.section
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="ev-panel p-6 md:p-7 border-[#caa7ff]/20 bg-[#caa7ff]/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="ev-section-kicker !text-[#caa7ff]">Active operations</div>
                    <div className="mt-1 text-2xl font-bold">{selectedEvent.title}</div>
                  </div>
                  <button onClick={() => setSelectedEventId(null)} className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white">Close</button>
                </div>

                <div className="mt-8 grid gap-6">
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Revenue State</div>
                      <div className="flex gap-2">
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                          {revenueSummary?.auditStatus || "pending"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 lg:grid-cols-4">
                      {[
                        ["Gross", revenueSummary?.totals?.grossTicketRevenue || 0],
                        ["Platform", revenueSummary?.totals?.platformFeeTotal || 0],
                        ["Net", revenueSummary?.totals?.netRevenueTotal || 0],
                        ["Host", revenueSummary?.totals?.hostShare || 0],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="bg-black/40 p-3 text-center">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</div>
                          <div className="mt-1 text-sm font-bold text-white">${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Run of Show</div>
                    <div className="mt-4 grid gap-4">
                      <textarea
                        value={operationsForm.objective}
                        onChange={(event) => setOperationsForm({ ...operationsForm, objective: event.target.value })}
                        placeholder="Mission objective"
                        className="h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                      />
                      <textarea
                        value={operationsForm.runOfShow}
                        onChange={(event) => setOperationsForm({ ...operationsForm, runOfShow: event.target.value })}
                        placeholder="Full sequence of events"
                        className="h-40 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                      />
                      <button 
                        type="button" 
                        onClick={() => void saveOperations()} 
                        className="rounded-xl bg-white/10 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/20"
                      >
                        Save internal detail
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ticket Inventory</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{ticketTypes.length} types</div>
                    </div>
                    
                    <div className="mt-4 grid gap-2">
                      {ticketTypes.map((ticketType) => (
                        <div key={ticketType.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                          <div>
                            <div className="text-sm font-bold text-white">{ticketType.name}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                              ${(ticketType.price_cents / 100).toFixed(2)} · {ticketType.quantity_sold}/{ticketType.quantity_total} sold
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              type="button" 
                              onClick={() => void patchTicketType(ticketType.id, { isActive: !ticketType.is_active })} 
                              className={`h-7 rounded-lg px-2 text-[9px] font-bold uppercase tracking-widest transition ${ticketType.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/40"}`}
                            >
                              {ticketType.is_active ? "Active" : "Paused"}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => void patchTicketType(ticketType.id, { visibilityMode: ticketType.visibility_mode === "hidden" ? "visible" : "hidden" })} 
                              className="h-7 rounded-lg bg-white/5 px-2 text-[9px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10"
                            >
                              {ticketType.visibility_mode === "hidden" ? "Show" : "Hide"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={createTicketType} className="mt-6 border-t border-white/10 pt-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">New Release</div>
                      <div className="mt-4 grid gap-3">
                        <input value={ticketForm.name} onChange={(event) => setTicketForm({ ...ticketForm, name: event.target.value })} placeholder="Release Name" className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" required />
                        <div className="grid grid-cols-2 gap-3">
                          <input value={ticketForm.priceCents} onChange={(event) => setTicketForm({ ...ticketForm, priceCents: event.target.value })} placeholder="Price (Cents)" className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
                          <input value={ticketForm.quantityTotal} onChange={(event) => setTicketForm({ ...ticketForm, quantityTotal: event.target.value })} placeholder="Inventory" className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
                        </div>
                        <button type="submit" disabled={submitting} className="rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50">
                          {submitting ? "Releasing..." : "Open release"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </section>
      </div>

      <datalist id="event-city-options">
        {INTERNAL_CITY_OPTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </main>
  );
}
