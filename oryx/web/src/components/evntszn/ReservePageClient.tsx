"use client";

import { useMemo, useState } from "react";
import ReturnTrigger from "@/components/evntszn/ReturnTrigger";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReserveVenueSummary } from "@/lib/evntszn-phase-shared";
import { buildReservationCheckoutPayload } from "@/lib/evntszn-phase-shared";
import { formatUsd } from "@/lib/money";

export default function ReservePageClient({
  venues,
}: {
  venues: ReserveVenueSummary[];
}) {
  const { upsertItem } = useSavedItems();
  const [selectedSlug, setSelectedSlug] = useState(venues[0]?.slug || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(venues[0]?.slots[0] || "");
  const [partySize, setPartySize] = useState("4");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [waitlist, setWaitlist] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.slug === selectedSlug) || venues[0],
    [selectedSlug, venues],
  );

  async function handleSubmit() {
    if (!selectedVenue) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/reserve/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildReservationCheckoutPayload({
            venue: selectedVenue,
            date,
            time,
            partySize: Number(partySize || 1),
            guestName,
            guestEmail,
            guestPhone,
            waitlist,
          }),
        ),
      });
      const payload = (await response.json()) as {
        error?: string;
        checkoutUrl?: string | null;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Could not start reservation.");
      if (payload.checkoutUrl) {
        await upsertItem({
          intent: "plan",
          entityType: "reserve",
          entityKey: selectedVenue.slug,
          title: `${selectedVenue.name} reservation`,
          href: `/reserve/${selectedVenue.slug}`,
          city: selectedVenue.city,
          state: selectedVenue.state,
          startsAt: `${date}T${time}`,
        });
        window.location.href = payload.checkoutUrl;
        return;
      }
      await upsertItem({
        intent: "plan",
        entityType: "reserve",
        entityKey: selectedVenue.slug,
        title: `${selectedVenue.name} reservation`,
        href: `/reserve/${selectedVenue.slug}`,
        city: selectedVenue.city,
        state: selectedVenue.state,
        startsAt: `${date}T${time}`,
      });
      setMessage(payload.message || "Reservation request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectedVenue) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="space-y-5">
        <div>
          <Badge className="border-[#A259FF]/25 bg-[#A259FF]/12 text-[#f1e7ff]">Reserve Revenue Engine</Badge>
          <CardTitle className="mt-4 text-3xl">Reserve tables, paid holds, and waitlist lanes.</CardTitle>
          <CardDescription className="mt-3">
            EVNTSZN Reserve keeps the booking flow premium and trustworthy with visible inventory, clear hold fees, and fast next steps.
          </CardDescription>
        </div>

        <div className="space-y-3">
          {venues.map((venue) => (
            <div
              key={venue.slug}
              className={`w-full rounded-2xl border p-4 text-left ${
                selectedSlug === venue.slug
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-black/20 text-white/72"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlug(venue.slug);
                    setTime(venue.slots[0] || "");
                  }}
                  className="text-left"
                >
                  <div className="text-lg font-black">{venue.name}</div>
                  <div className="text-sm opacity-70">{venue.city}, {venue.state}</div>
                </button>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">{formatUsd(venue.reservationFeeUsd)}</div>
                  <SaveToggle
                    item={{
                      intent: "watch",
                      entityType: "reserve",
                      entityKey: venue.slug,
                      title: `${venue.name} watch`,
                      href: `/reserve/${venue.slug}`,
                      city: venue.city,
                      state: venue.state,
                    }}
                    inactiveLabel="Watch"
                    activeLabel="Watching"
                    className={selectedSlug === venue.slug ? "border-black/10 bg-black text-white" : ""}
                  />
                </div>
              </div>
              <div className="mt-2 text-sm opacity-75">{venue.urgency}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Venue</div>
            <Select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
              {venues.map((venue) => (
                <option key={venue.slug} value={venue.slug}>
                  {venue.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Date</div>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Time</div>
            <Select value={time} onChange={(event) => setTime(event.target.value)}>
              {selectedVenue.slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Party size</div>
            <Input
              type="number"
              min={1}
              max={selectedVenue.maxPartySize}
              value={partySize}
              onChange={(event) => setPartySize(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="Guest name" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
          <Input placeholder="Guest email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
          <Input placeholder="Guest phone" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} />
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
            <input type="checkbox" checked={waitlist} onChange={(event) => setWaitlist(event.target.checked)} />
            Join waitlist if confirmed inventory closes
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {selectedVenue.slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setTime(slot)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                time === slot ? "border-white bg-white text-black" : "border-white/10 bg-black/20 text-white/70"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          {selectedVenue.urgency}. Hold fee: {formatUsd(selectedVenue.reservationFeeUsd)}. EVNTSZN confirms the lane before inventory closes.
        </div>

        <SaveToggle
          item={{
            intent: "save",
            entityType: "reserve",
            entityKey: selectedVenue.slug,
            title: selectedVenue.name,
            href: `/reserve/${selectedVenue.slug}`,
            city: selectedVenue.city,
            state: selectedVenue.state,
          }}
          inactiveLabel="Save this reserve"
          activeLabel="Saved reserve"
        />

        <ReturnTrigger href={`/reserve/${selectedVenue.slug}`} tone="reserve" />

        {message ? <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">{message}</div> : null}

        <Button onClick={handleSubmit} disabled={submitting || !guestName || !guestEmail || !time} className="w-full">
          {submitting ? "Starting checkout..." : "Reserve now"}
        </Button>
      </Card>
    </div>
  );
}
