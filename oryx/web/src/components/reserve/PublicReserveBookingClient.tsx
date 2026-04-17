"use client";

import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/money";

type SlotRow = {
  id: string;
  reserve_venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity_limit: number;
  is_active: boolean;
};

type VenuePayload = {
  id: string;
  venueId: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  venue: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    timezone: string;
  } | null;
};

export default function PublicReserveBookingClient({
  venue,
  slots,
}: {
  venue: VenuePayload;
  slots: SlotRow[];
}) {
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState(slots[0]?.start_time.slice(0, 5) || "19:00");
  const [partySize, setPartySize] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableTimes = useMemo(() => slots.map((slot) => slot.start_time.slice(0, 5)), [slots]);

  async function submitBooking() {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/reserve/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reserveVenueId: venue.id,
          venueSlug: venue.venue?.slug,
          guestName,
          guestEmail,
          guestPhone,
          bookingDate,
          bookingTime,
          partySize: Number(partySize || 1),
          occasion,
        }),
      });
      const payload = (await response.json()) as { error?: string; booking?: { status: string } };
      if (!response.ok) throw new Error(payload.error || "Could not request reservation.");
      const bookingStatus = payload.booking?.status || "confirmed";
      setMessage(`Reservation ${bookingStatus === "waitlisted" ? "added to waitlist" : "confirmed"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-black/35 p-6 md:p-8">
      <div className="ev-section-kicker">Reserve booking</div>
      <h2 className="mt-2 text-3xl font-black text-white">Book dining, nightlife tables, and waitlist access without leaving EVNTSZN.</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Reservation fee</div>
          <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(venue.settings?.reservation_fee_usd || 0))}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Average check</div>
          <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(venue.settings?.average_check_usd || 0))}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Waitlist</div>
          <div className="mt-3 text-2xl font-black text-white">{venue.settings?.waitlist_enabled === false ? "Off" : "On"}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Guest name" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
        <input className="ev-field" placeholder="Guest email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
        <input className="ev-field" placeholder="Guest phone" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} />
        <input className="ev-field" placeholder="Occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)} />
        <input className="ev-field" type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />
        <select className="ev-field" value={bookingTime} onChange={(event) => setBookingTime(event.target.value)}>
          {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
        <input className="ev-field md:col-span-2" type="number" min="1" max={Number(venue.settings?.max_party_size || 8)} value={partySize} onChange={(event) => setPartySize(event.target.value)} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => setBookingTime(slot.start_time.slice(0, 5))}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              bookingTime === slot.start_time.slice(0, 5) ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/72"
            }`}
          >
            {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)} · capacity {slot.capacity_limit}
          </button>
        ))}
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">{message}</div> : null}

      <button type="button" onClick={submitBooking} disabled={submitting} className="ev-button-primary mt-6 px-8">
        {submitting ? "Submitting..." : "Request reservation"}
      </button>
    </section>
  );
}
