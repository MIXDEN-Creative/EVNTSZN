"use client";

import { useState } from "react";
import SaveToggle from "@/components/evntszn/SaveToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deriveReserveStandaloneMonthlyPrice } from "@/lib/evntszn-monetization";
import type { PublicEventListing } from "@/lib/public-directory";
import type { VenueSupplySummary } from "@/lib/evntszn-phase-shared";

type VenueDashboardSnapshot = {
  venues: VenueSupplySummary[];
  events: PublicEventListing[];
};

export default function VenueOpsClient({
  mode,
  snapshot,
}: {
  mode: "listing" | "dashboard";
  snapshot: VenueDashboardSnapshot;
}) {
  const [venues, setVenues] = useState(snapshot.venues);
  const [events, setEvents] = useState(snapshot.events);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [planKey, setPlanKey] = useState("venue_free");
  const [reservePlanKey, setReservePlanKey] = useState("");
  const [smartFillEnabled, setSmartFillEnabled] = useState(false);
  const [smartFillPriceNote, setSmartFillPriceNote] = useState("$29/month add-on");
  const [notes, setNotes] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState(snapshot.venues[0]?.id || "");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createVenue() {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          state,
          capacity: capacity ? Number(capacity) : null,
          contactEmail,
          planKey,
          reservePlanKey: reservePlanKey || null,
          smartFillEnabled,
          smartFillPriceNote,
          notes,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        venue?: VenueSupplySummary;
        message?: string;
      };
      if (!response.ok || !payload.venue) throw new Error(payload.error || "Could not create venue.");
      setVenues((current) => [payload.venue!, ...current]);
      setSelectedVenueId(payload.venue.id);
      setMessage(payload.message || "Venue listed.");
      setName("");
      setCity("");
      setState("");
      setCapacity("");
      setContactEmail("");
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create venue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function postEvent() {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/venues/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenueId,
          title: eventTitle,
          startAt: eventStartAt,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        event?: PublicEventListing;
        message?: string;
      };
      if (!response.ok || !payload.event) throw new Error(payload.error || "Could not post event.");
      setEvents((current) => [payload.event!, ...current]);
      setMessage(payload.message || "Event posted.");
      setEventTitle("");
      setEventStartAt("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not post event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <Badge>Venue Entry</Badge>
          <CardTitle className="mt-4 text-3xl">
            {mode === "listing" ? "List a venue for free and turn on Smart Fill." : "Basic remote venue dashboard."}
          </CardTitle>
          <CardDescription className="mt-3">
            Venue pricing, Reserve access, Link Pro inclusion, Smart Fill, and node eligibility now follow the backend business rules instead of UI placeholders.
          </CardDescription>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {mode === "listing" ? (
            <>
              <Input placeholder="Venue name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input placeholder="Contact email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
              <Input placeholder="State" value={state} onChange={(event) => setState(event.target.value)} />
              <Input type="number" min={1} placeholder="Venue capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
              <Select value={planKey} onChange={(event) => setPlanKey(event.target.value)}>
                <option value="venue_free">Venue Free</option>
                <option value="venue_pro">Venue Pro</option>
                <option value="venue_pro_reserve">Venue Pro + Reserve</option>
              </Select>
              <Select value={reservePlanKey} onChange={(event) => setReservePlanKey(event.target.value)}>
                <option value="">No standalone Reserve</option>
                <option value="reserve_standalone">Reserve standalone</option>
              </Select>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm text-white/72">
                  <span>Smart Fill add-on</span>
                  <Switch
                    checked={smartFillEnabled}
                    onChange={(event) => setSmartFillEnabled(event.target.checked)}
                    disabled={planKey !== "venue_free"}
                  />
                </div>
              </div>
              <Input placeholder="Smart Fill price note" value={smartFillPriceNote} onChange={(event) => setSmartFillPriceNote(event.target.value)} />
              <Textarea placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="sm:col-span-2" />
            </>
          ) : (
            <>
              <select
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
                value={selectedVenueId}
                onChange={(event) => setSelectedVenueId(event.target.value)}
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              <Input placeholder="Event title" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
              <Input type="datetime-local" value={eventStartAt} onChange={(event) => setEventStartAt(event.target.value)} />
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/72">
                Event post fee logic: $0.99 per event.
              </div>
            </>
          )}
        </div>

        {message ? <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">{message}</div> : null}

        {mode === "listing" ? (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70 sm:grid-cols-2">
            <div>Venue Free: $0/month. Smart Fill add-on: $29/month.</div>
            <div>Venue Pro: $39/month with Smart Fill, Nodes, messaging, and Link Pro included.</div>
            <div>Venue Pro + Reserve: $99/month plus $0.30 per reservation.</div>
            <div>
              Reserve standalone: {capacity && Number(capacity) >= 150 ? "$79/month" : `$${deriveReserveStandaloneMonthlyPrice(Number(capacity || 0))}/month`} plus $0.50 per reservation.
            </div>
          </div>
        ) : null}

        <Button onClick={mode === "listing" ? createVenue : postEvent} disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Saving..." : mode === "listing" ? "Create venue listing" : "Post event for $0.99 logic"}
        </Button>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle>Live venues</CardTitle>
          <div className="space-y-3">
            {venues.map((venue) => (
              <div key={venue.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-white">{venue.name}</div>
                    <div className="text-sm text-white/58">{venue.city}, {venue.state}{venue.capacity ? ` · cap ${venue.capacity}` : ""}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={venue.smartFillEnabled ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100" : ""}>
                      {venue.smartFillEnabled ? "Smart Fill on" : "Standard listing"}
                    </Badge>
                    <SaveToggle
                      item={{
                        intent: "save",
                        entityType: "venue",
                        entityKey: venue.slug,
                        title: venue.name,
                        href: `/venues`,
                        city: venue.city,
                        state: venue.state,
                      }}
                      inactiveLabel="Save venue"
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-white/65">
                  {venue.planKey ? venue.planKey.replace(/_/g, " ") : "venue free"}
                  {venue.monthlyPriceUsd !== undefined ? ` · $${venue.monthlyPriceUsd}/mo` : ""}
                  {venue.reserveEnabled && venue.reserveMonthlyPriceUsd ? ` · reserve $${venue.reserveMonthlyPriceUsd}/mo` : ""}
                  {venue.smartFillPriceNote ? ` · ${venue.smartFillPriceNote}` : ""}
                  {venue.linkSlug ? ` · /link/${venue.linkSlug}` : ""}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <CardTitle>Recent event posts</CardTitle>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-black text-white">{event.title}</div>
                <div className="mt-1 text-sm text-white/58">{event.city}, {event.state}</div>
                <div className="mt-2 text-sm text-white/65">{event.subtitle || event.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
