"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUsd } from "@/lib/money";

type VenueRow = {
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

type SlotRow = {
  id: string;
  reserve_venue_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity_limit: number;
  is_active: boolean;
};

type BookingRow = {
  id: string;
  reserve_venue_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  booking_date: string;
  booking_time: string;
  party_size: number;
  status: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReserveDashboardClient({
  initialVenues,
  initialSlots,
  initialBookings,
}: {
  initialVenues: VenueRow[];
  initialSlots: SlotRow[];
  initialBookings: BookingRow[];
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [slots, setSlots] = useState(initialSlots);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedReserveVenueId, setSelectedReserveVenueId] = useState(initialVenues[0]?.id || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [venueForm, setVenueForm] = useState({
    cuisine: String(initialVenues[0]?.settings?.cuisine || ""),
    neighborhood: String(initialVenues[0]?.settings?.neighborhood || ""),
    reservationFeeUsd: String(initialVenues[0]?.settings?.reservation_fee_usd ?? 0),
    averageCheckUsd: String(initialVenues[0]?.settings?.average_check_usd || ""),
    bookingWindowDays: String(initialVenues[0]?.settings?.booking_window_days || 30),
    maxPartySize: String(initialVenues[0]?.settings?.max_party_size || 8),
    waitlistEnabled: initialVenues[0]?.settings?.waitlist_enabled !== false,
    diningEnabled: initialVenues[0]?.settings?.dining_enabled !== false,
    nightlifeEnabled: initialVenues[0]?.settings?.nightlife_enabled !== false,
    seatingNotes: String(initialVenues[0]?.settings?.seating_notes || ""),
  });
  const [slotForm, setSlotForm] = useState({
    daysOfWeek: "4,5,6",
    startTime: "19:00",
    endTime: "23:00",
    capacityLimit: "24",
  });

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedReserveVenueId) || venues[0] || null,
    [selectedReserveVenueId, venues],
  );

  useEffect(() => {
    if (!selectedVenue) return;
    setVenueForm({
      cuisine: String(selectedVenue.settings?.cuisine || ""),
      neighborhood: String(selectedVenue.settings?.neighborhood || ""),
      reservationFeeUsd: String(selectedVenue.settings?.reservation_fee_usd ?? 0),
      averageCheckUsd: String(selectedVenue.settings?.average_check_usd || ""),
      bookingWindowDays: String(selectedVenue.settings?.booking_window_days || 30),
      maxPartySize: String(selectedVenue.settings?.max_party_size || 8),
      waitlistEnabled: selectedVenue.settings?.waitlist_enabled !== false,
      diningEnabled: selectedVenue.settings?.dining_enabled !== false,
      nightlifeEnabled: selectedVenue.settings?.nightlife_enabled !== false,
      seatingNotes: String(selectedVenue.settings?.seating_notes || ""),
    });
  }, [selectedVenue]);

  async function refreshData(targetReserveVenueId = selectedReserveVenueId) {
    const [venueRes, slotRes, bookingRes] = await Promise.all([
      fetch("/api/reserve/venues?mine=1", { cache: "no-store" }),
      targetReserveVenueId
        ? fetch(`/api/reserve/slots?reserveVenueId=${encodeURIComponent(targetReserveVenueId)}`, { cache: "no-store" })
        : Promise.resolve(new Response(JSON.stringify({ slots: [] }), { status: 200 })),
      fetch(`/api/reserve/bookings${targetReserveVenueId ? `?reserveVenueId=${encodeURIComponent(targetReserveVenueId)}` : ""}`, { cache: "no-store" }),
    ]);

    const venueJson = (await venueRes.json()) as { venues?: VenueRow[]; error?: string };
    const slotJson = (await slotRes.json()) as { slots?: SlotRow[]; error?: string };
    const bookingJson = (await bookingRes.json()) as { bookings?: BookingRow[]; error?: string };
    if (!venueRes.ok) throw new Error(venueJson.error || "Could not reload Reserve venues.");
    if (!slotRes.ok) throw new Error(slotJson.error || "Could not reload Reserve slots.");
    if (!bookingRes.ok) throw new Error(bookingJson.error || "Could not reload Reserve bookings.");

    setVenues(venueJson.venues || []);
    setSlots(slotJson.slots || []);
    setBookings(bookingJson.bookings || []);
  }

  async function saveVenueSettings() {
    if (!selectedVenue?.venueId) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reserve/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenue.venueId,
          isActive: true,
          settings: {
            cuisine: venueForm.cuisine,
            neighborhood: venueForm.neighborhood,
            reservation_fee_usd: Number(venueForm.reservationFeeUsd || 0),
            average_check_usd: venueForm.averageCheckUsd ? Number(venueForm.averageCheckUsd) : null,
            booking_window_days: Number(venueForm.bookingWindowDays || 30),
            max_party_size: Number(venueForm.maxPartySize || 8),
            waitlist_enabled: venueForm.waitlistEnabled,
            dining_enabled: venueForm.diningEnabled,
            nightlife_enabled: venueForm.nightlifeEnabled,
            seating_notes: venueForm.seatingNotes,
            service_modes: [
              venueForm.diningEnabled ? "dining" : null,
              venueForm.nightlifeEnabled ? "nightlife" : null,
            ].filter(Boolean),
          },
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save Reserve venue.");
      await refreshData(selectedReserveVenueId);
      setMessage("Reserve venue settings updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Reserve settings.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSlot() {
    if (!selectedReserveVenueId) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reserve/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reserveVenueId: selectedReserveVenueId,
          slots: [{
            daysOfWeek: slotForm.daysOfWeek
              .split(",")
              .map((value) => Number(value.trim()))
              .filter((value) => Number.isInteger(value)),
            startTime: slotForm.startTime,
            endTime: slotForm.endTime,
            capacityLimit: Number(slotForm.capacityLimit || 1),
          }],
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save Reserve slot.");
      await refreshData(selectedReserveVenueId);
      setMessage("Reserve slot block saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Reserve slot.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(id: string, status: string) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/reserve/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update Reserve booking.");
      await refreshData(selectedReserveVenueId);
      setMessage(`Booking moved to ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update booking.");
    } finally {
      setSaving(false);
    }
  }

  const filteredBookings = bookings.filter((booking) => bookingFilter === "all" || booking.status === bookingFilter);
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const waitlistedBookings = bookings.filter((booking) => booking.status === "waitlisted");
  const projectedReservationRevenue = confirmedBookings.length * Number(selectedVenue?.settings?.reservation_fee_usd || 0);
  const projectedGuestCovers = confirmedBookings.reduce((sum, booking) => sum + Number(booking.party_size || 0), 0);

  return (
    <div className="space-y-8">
      {message ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">{message}</div> : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="ev-section-kicker">Reserve command</div>
            <h2 className="mt-2 text-2xl font-black text-white">Manage dining, nightlife, and waitlist pressure from one lane.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {venues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => setSelectedReserveVenueId(venue.id)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                  selectedReserveVenueId === venue.id ? "border-white bg-white text-black" : "border-white/15 bg-black/30 text-white/65"
                }`}
              >
                {venue.venue?.name || "Reserve venue"}
              </button>
            ))}
          </div>
        </div>
        {selectedVenue ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Reservation fee</div>
              <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(selectedVenue.settings?.reservation_fee_usd || 0))}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Avg check</div>
              <div className="mt-3 text-2xl font-black text-white">{formatUsd(Number(selectedVenue.settings?.average_check_usd || 0))}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Dining</div>
              <div className="mt-3 text-2xl font-black text-white">{selectedVenue.settings?.dining_enabled === false ? "Off" : "On"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Nightlife</div>
              <div className="mt-3 text-2xl font-black text-white">{selectedVenue.settings?.nightlife_enabled === false ? "Off" : "On"}</div>
            </div>
          </div>
        ) : null}
        {selectedVenue ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Projected booking revenue</div>
              <div className="mt-3 text-2xl font-black text-white">{formatUsd(projectedReservationRevenue)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Confirmed covers</div>
              <div className="mt-3 text-2xl font-black text-white">{projectedGuestCovers}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Waitlist pressure</div>
              <div className="mt-3 text-2xl font-black text-white">{waitlistedBookings.length}</div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="ev-section-kicker">Venue setup</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="ev-field" placeholder="Cuisine" value={venueForm.cuisine} onChange={(event) => setVenueForm({ ...venueForm, cuisine: event.target.value })} />
            <input className="ev-field" placeholder="Neighborhood" value={venueForm.neighborhood} onChange={(event) => setVenueForm({ ...venueForm, neighborhood: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Reservation fee USD" value={venueForm.reservationFeeUsd} onChange={(event) => setVenueForm({ ...venueForm, reservationFeeUsd: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Average check USD" value={venueForm.averageCheckUsd} onChange={(event) => setVenueForm({ ...venueForm, averageCheckUsd: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Booking window days" value={venueForm.bookingWindowDays} onChange={(event) => setVenueForm({ ...venueForm, bookingWindowDays: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Max party size" value={venueForm.maxPartySize} onChange={(event) => setVenueForm({ ...venueForm, maxPartySize: event.target.value })} />
          </div>
          <textarea className="ev-field mt-4 min-h-[120px]" placeholder="Seating notes, dress code, or arrival rules" value={venueForm.seatingNotes} onChange={(event) => setVenueForm({ ...venueForm, seatingNotes: event.target.value })} />
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/65">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={venueForm.waitlistEnabled} onChange={(event) => setVenueForm({ ...venueForm, waitlistEnabled: event.target.checked })} /> Waitlist enabled</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={venueForm.diningEnabled} onChange={(event) => setVenueForm({ ...venueForm, diningEnabled: event.target.checked })} /> Dining reservations</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={venueForm.nightlifeEnabled} onChange={(event) => setVenueForm({ ...venueForm, nightlifeEnabled: event.target.checked })} /> Nightlife tables</label>
          </div>
          <button type="button" onClick={saveVenueSettings} disabled={saving || !selectedVenue} className="ev-button-primary mt-6 px-6">
            {saving ? "Saving..." : "Save Reserve setup"}
          </button>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="ev-section-kicker">Slot engine</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="ev-field" placeholder="Days of week (0,1,2)" value={slotForm.daysOfWeek} onChange={(event) => setSlotForm({ ...slotForm, daysOfWeek: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Capacity" value={slotForm.capacityLimit} onChange={(event) => setSlotForm({ ...slotForm, capacityLimit: event.target.value })} />
            <input className="ev-field" type="time" value={slotForm.startTime} onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })} />
            <input className="ev-field" type="time" value={slotForm.endTime} onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })} />
          </div>
          <button type="button" onClick={saveSlot} disabled={saving || !selectedVenue} className="ev-button-primary mt-6 px-6">
            {saving ? "Saving..." : "Add slot block"}
          </button>
          <div className="mt-6 space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/72">
                {DAY_LABELS[slot.day_of_week]} · {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)} · capacity {slot.capacity_limit} · {slot.is_active ? "active" : "inactive"}
              </div>
            ))}
            {!slots.length ? <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-white/55">No Reserve slots configured yet.</div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="ev-section-kicker">Bookings</div>
            <h2 className="mt-2 text-2xl font-black text-white">Work confirmed guests and waitlist flow in real time.</h2>
          </div>
          <select className="ev-field max-w-[220px]" value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="checked_in">Checked in</option>
            <option value="no_show">No show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">{booking.guest_name}</div>
                  <div className="mt-1 text-sm text-white/55">{booking.booking_date} at {booking.booking_time.slice(0, 5)} · party of {booking.party_size}</div>
                  <div className="mt-1 text-sm text-white/45">{booking.guest_email}{booking.guest_phone ? ` · ${booking.guest_phone}` : ""}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">
                  {booking.status}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["confirmed", "waitlisted", "checked_in", "no_show", "cancelled"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateBookingStatus(booking.id, status)}
                    disabled={saving || booking.status === status}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!filteredBookings.length ? <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">No Reserve bookings are in this lane yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
