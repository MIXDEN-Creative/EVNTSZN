"use client";

import { useState } from "react";

const MARKET_OPTIONS = ["Baltimore", "Washington", "Rehoboth Beach", "Ocean City", "Bethany Beach"] as const;

export default function ReserveIntakeForm() {
  const [form, setForm] = useState<{
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    companyName: string;
    market: string;
    venueName: string;
    reservePlan: string;
    averageWeeklyReservations: string;
    primaryNeed: string;
    notes: string;
  }>({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    market: String(MARKET_OPTIONS[0]),
    venueName: "",
    reservePlan: "venue_pro_reserve",
    averageWeeklyReservations: "",
    primaryNeed: "table-service",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/public/reserve-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || "Could not submit the Reserve intake.");
      setSubmitting(false);
      return;
    }

    setMessage("Reserve intake submitted. The Reserve desk now has the request and routing context.");
    setSubmitting(false);
    setForm({
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      companyName: "",
      market: String(MARKET_OPTIONS[0]),
      venueName: "",
      reservePlan: "venue_pro_reserve",
      averageWeeklyReservations: "",
      primaryNeed: "table-service",
      notes: "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-black/30 p-6 md:p-8">
      <div className="ev-section-kicker">Reserve intake</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Route Reserve through one live booking workflow.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
        Use this intake for Venue Pro + Reserve, standalone Reserve, or an existing venue that needs reservation operations moved into EVNTSZN.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Contact name" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Contact phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
        <input className="ev-field" placeholder="Company or venue group" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
        <select className="ev-field" value={form.market} onChange={(event) => setForm({ ...form, market: event.target.value })}>
          {MARKET_OPTIONS.map((market) => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>
        <input className="ev-field" placeholder="Venue name" value={form.venueName} onChange={(event) => setForm({ ...form, venueName: event.target.value })} required />
        <select className="ev-field" value={form.reservePlan} onChange={(event) => setForm({ ...form, reservePlan: event.target.value })}>
          <option value="venue_listing">Venue listing</option>
          <option value="venue_pro">Venue Pro</option>
          <option value="venue_pro_reserve">Venue Pro + Reserve</option>
          <option value="reserve_standalone">Reserve standalone</option>
        </select>
        <input className="ev-field" type="number" min="0" step="1" placeholder="Average weekly reservations" value={form.averageWeeklyReservations} onChange={(event) => setForm({ ...form, averageWeeklyReservations: event.target.value })} />
        <select className="ev-field md:col-span-2" value={form.primaryNeed} onChange={(event) => setForm({ ...form, primaryNeed: event.target.value })}>
          <option value="table-service">Table service and waitlist</option>
          <option value="nightlife-booking">Nightlife booking control</option>
          <option value="event-reservations">Event reservation routing</option>
          <option value="host-concierge">Curator concierge and VIP</option>
        </select>
        <textarea className="ev-textarea md:col-span-2" rows={5} placeholder="Operations notes, guest flow issues, or launch timing" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </div>

      <button type="submit" disabled={submitting} className="ev-button-primary mt-7">
        {submitting ? "Submitting..." : "Send to Reserve desk"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
