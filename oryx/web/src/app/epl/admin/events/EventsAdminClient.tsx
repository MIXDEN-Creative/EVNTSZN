"use client";

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
  event_collection: string | null;
  home_side_label: string | null;
  away_side_label: string | null;
  payout_account_label: string | null;
  scanner_status: string;
  venue_name: string | null;
};

type EventResponse = {
  ok?: boolean;
  error?: string;
  events?: ManagedEvent[];
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
  publishNow: true,
  payoutAccountLabel: "ORYX Event Ops",
  bannerImageUrl: "",
  eventVertical: "evntszn" as "evntszn" | "epl",
  eventCollection: "",
  homeSideLabel: "",
  awaySideLabel: "",
};

export default function EventsAdminClient() {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "evntszn" | "epl">("all");
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadEvents(nextFilter = filter) {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (nextFilter !== "all") params.set("vertical", nextFilter);
      const response = await fetch(`/api/evntszn/events?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as EventResponse;
      if (!response.ok) throw new Error(payload.error || "Could not load events.");
      setEvents(payload.events || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents(filter);
  }, [filter]);

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
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
      setMessage("Event created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  }

  async function quickPatch(eventId: string, patch: Record<string, unknown>) {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/evntszn/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update event.");
      await loadEvents(filter);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update event.");
    } finally {
      setSubmitting(false);
    }
  }

  const counts = useMemo(
    () => ({
      total: events.length,
      evntszn: events.filter((item) => item.event_vertical === "evntszn").length,
      epl: events.filter((item) => item.event_vertical === "epl").length,
      published: events.filter((item) => item.status === "published").length,
    }),
    [events],
  );

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Event desk</div>
            <h1 className="ev-title">Create EVNTSZN and EPL events from one protected desk.</h1>
            <p className="ev-subtitle">
              Launch public discovery inventory, keep EPL event setup distinct when needed, and publish without touching code.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Total events", counts.total],
              ["EVNTSZN", counts.evntszn],
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="ev-panel">
          <div className="ev-section-kicker">Create event</div>
          <div className="mt-3 text-2xl font-bold">Launch the next public event surface.</div>
          <form onSubmit={createEvent} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
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

            {[
              ["title", "Event title"],
              ["subtitle", "Subtitle"],
              ["venueName", "Venue name"],
              ["city", "City"],
              ["state", "State"],
              ["startAt", "Start ISO datetime"],
              ["endAt", "End ISO datetime"],
              ["bannerImageUrl", "Banner image URL"],
              ["payoutAccountLabel", "Payout account label"],
              ["capacity", "Capacity"],
              ["ticketTypeName", "Ticket type"],
              ["ticketPriceCents", "Ticket price cents"],
              ["ticketQuantityTotal", "Ticket quantity"],
              ["maxPerOrder", "Max per order"],
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

            {form.eventVertical === "epl" ? (
              <div className="grid gap-4 md:grid-cols-2">
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
          {message ? <div className="mt-4 text-sm text-white/72">{message}</div> : null}
        </section>

        <section className="ev-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">Event roster</div>
              <div className="mt-2 text-2xl font-bold">Published, draft, and league-ready surfaces.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "evntszn", "epl"] as const).map((value) => (
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
                  {value === "all" ? "All" : value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {loading ? <div className="text-white/60">Loading events...</div> : null}
            {!loading && !events.length ? (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-5 text-white/58">
                No events in this filter yet. Create the next EVNTSZN or EPL event from the panel.
              </div>
            ) : null}

            {events.map((event) => (
              <div key={event.id} className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                      <span>{event.event_vertical.toUpperCase()}</span>
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
