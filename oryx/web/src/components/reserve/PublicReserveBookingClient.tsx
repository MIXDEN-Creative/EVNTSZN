"use client";

import { useEffect, useMemo, useState } from "react";
import ReturnTrigger from "@/components/evntszn/ReturnTrigger";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { getReserveUrgencyLabel } from "@/lib/evntszn-phase";
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
  const { upsertItem } = useSavedItems();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxBookableDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + Math.max(1, Number(venue.settings?.booking_window_days || 30)));
    return date.toISOString().slice(0, 10);
  }, [venue.settings]);
  const [bookingDate, setBookingDate] = useState(today);
  const [partySize, setPartySize] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeDayOfWeek = useMemo(() => {
    const date = new Date(`${bookingDate}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.getUTCDay();
  }, [bookingDate]);

  const availableSlots = useMemo(() => {
    if (activeDayOfWeek === null) return [];
    return slots.filter((slot) => slot.is_active && slot.day_of_week === activeDayOfWeek);
  }, [activeDayOfWeek, slots]);

  const availableTimes = useMemo(() => {
    const uniqueTimes = new Set<string>();
    for (const slot of availableSlots) {
      uniqueTimes.add(slot.start_time.slice(0, 5));
    }
    return [...uniqueTimes];
  }, [availableSlots]);
  const urgency = useMemo(
    () =>
      getReserveUrgencyLabel({
        slotCount: availableTimes.length,
        reservationFeeUsd: Number(venue.settings?.reservation_fee_usd || 0),
        waitlistEnabled: venue.settings?.waitlist_enabled !== false,
        isLateWindow: availableTimes.some((time) => Number(time.slice(0, 2)) >= 21),
      }),
    [availableTimes, venue.settings],
  );

  const [bookingTime, setBookingTime] = useState("");

  useEffect(() => {
    if (!availableTimes.length) {
      if (bookingTime) setBookingTime("");
      return;
    }
    if (!availableTimes.includes(bookingTime)) {
      setBookingTime(availableTimes[0] || "");
    }
  }, [availableTimes, bookingTime]);

  async function submitBooking() {
    setSubmitting(true);
    setMessage("");
    try {
      if (!availableTimes.length) {
        throw new Error("No Reserve slots are available for the selected date.");
      }
      if (!bookingTime) {
        throw new Error("Select an available booking time.");
      }
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
      await upsertItem({
        intent: "plan",
        entityType: "reserve",
        entityKey: venue.venue?.slug || venue.id,
        title: venue.venue?.name || "Reserve plan",
        href: venue.venue?.slug ? `/reserve/${venue.venue.slug}` : "/reserve",
        city: venue.venue?.city || null,
        state: venue.venue?.state || null,
        startsAt: `${bookingDate}T${bookingTime}`,
        metadata: {
          bookingDate,
          bookingTime,
          partySize: Number(partySize || 1),
        },
      });
      const bookingStatus = payload.booking?.status || "confirmed";
      setMessage(`Reservation ${bookingStatus === "waitlisted" ? "added to waitlist" : "confirmed"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ev-section-frame">
      <div className="ev-dashboard-hero">
      <div className="ev-section-kicker">Reserve booking</div>
      <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white md:text-[2.35rem]">Reserve dining, nightlife tables, and waitlist access without leaving EVNTSZN.</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
        Availability sits up front, guest details stay clean, and confirmation happens in one calm flow.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-50">
          {urgency.label}
        </div>
        <SaveToggle
          item={{
            intent: "watch",
            entityType: "reserve",
            entityKey: venue.venue?.slug || venue.id,
            title: `${venue.venue?.name || "Reserve"} watch`,
            href: venue.venue?.slug ? `/reserve/${venue.venue.slug}` : "/reserve",
            city: venue.venue?.city || null,
            state: venue.venue?.state || null,
          }}
          inactiveLabel="Watch this spot"
          activeLabel="Watching spot"
        />
      </div>
      <div className="mt-6 ev-dashboard-metrics">
        <div className="ev-feature-card">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Reservation fee</div>
          <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(venue.settings?.reservation_fee_usd || 0))}</div>
        </div>
        <div className="ev-feature-card">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Average check</div>
          <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(venue.settings?.average_check_usd || 0))}</div>
        </div>
        <div className="ev-feature-card">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Waitlist</div>
          <div className="mt-3 text-2xl font-black text-white">{venue.settings?.waitlist_enabled === false ? "Off" : "On"}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="ev-list-card">
            <div className="ev-card-label">Choose your date</div>
            <input className="ev-field mt-3" type="date" min={today} max={maxBookableDate} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />
          </div>
          <div className="ev-list-card">
            <div className="ev-card-label">Preferred time</div>
            <select className="ev-field mt-3" value={bookingTime} onChange={(event) => setBookingTime(event.target.value)} disabled={!availableTimes.length}>
          {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Reserve surfaces only bookable times for the selected date so guests do not submit blind requests.
            </p>
          </div>
          <div className="ev-list-card">
            <div className="ev-card-label">Guest details</div>
            <div className="mt-3 grid gap-4">
              <input className="ev-field" placeholder="Guest name" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
              <input className="ev-field" placeholder="Guest email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
              <input className="ev-field" placeholder="Guest phone" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} />
              <input className="ev-field" placeholder="Occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)} />
              <input className="ev-field" type="number" min="1" max={Number(venue.settings?.max_party_size || 8)} value={partySize} onChange={(event) => setPartySize(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="ev-list-card">
            <div className="ev-card-label">Available slots</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setBookingTime(slot.start_time.slice(0, 5))}
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    bookingTime === slot.start_time.slice(0, 5) ? "border-white bg-white text-black shadow-[0_14px_30px_rgba(0,0,0,0.18)]" : "border-white/10 bg-white/[0.03] text-white/72 hover:border-white/18 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="text-sm font-black uppercase tracking-[0.16em]">{slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}</div>
                  <div className={`mt-2 text-sm ${bookingTime === slot.start_time.slice(0, 5) ? "text-black/70" : "text-white/56"}`}>
                    Capacity {slot.capacity_limit} · {getReserveUrgencyLabel({
                      slotCount: availableSlots.length,
                      waitlistEnabled: venue.settings?.waitlist_enabled !== false,
                    }).label}
                  </div>
                </button>
              ))}
            </div>
            {!availableSlots.length ? (
              <div className="ev-empty-state mt-4 text-sm">
                No Reserve slots are configured for that date yet. Choose another date or contact the venue directly.
              </div>
            ) : null}
          </div>

          {message ? <div className="ev-list-card text-sm text-white/75">{message}</div> : null}

          <div className="ev-list-card">
            <div className="ev-card-label">Confirmation</div>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Submit the request once the date, time, and party size feel right. If live capacity is exhausted and waitlist is enabled, EVNTSZN will place the booking into the waitlist flow instead of dropping it.
            </p>
            <div className="mt-4">
              <ReturnTrigger href={venue.venue?.slug ? `/reserve/${venue.venue.slug}` : "/reserve"} tone="reserve" />
            </div>
            <button type="button" onClick={submitBooking} disabled={submitting || !availableSlots.length || !bookingTime} className="ev-button-primary mt-5 w-full px-8">
        {submitting ? "Submitting..." : "Request reservation"}
      </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
