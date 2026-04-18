"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateCrewBookingFee, type CrewMemberSummary } from "@/lib/evntszn-phase-shared";
import { formatUsd } from "@/lib/money";

export default function CrewBookingClient({
  members,
}: {
  members: CrewMemberSummary[];
}) {
  const [selectedId, setSelectedId] = useState(members[0]?.id || "");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [budgetUsd, setBudgetUsd] = useState(String(members[0]?.priceFromUsd || 500));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(() => members.find((member) => member.id === selectedId) || members[0], [members, selectedId]);
  const pricing = calculateCrewBookingFee({
    subtotalUsd: Number(budgetUsd || selected?.priceFromUsd || 0),
    category: selected?.category || "",
    partnerTier: selected?.partnerTier,
  });

  async function submitRequest() {
    if (!selected) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/crew/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crewProfileId: selected.id,
          requestedByName: requesterName,
          requestedByEmail: requesterEmail,
          eventName,
          eventDate,
          city,
          message: notes,
          budgetAmountUsd: Number(budgetUsd || 0),
          category: selected.category,
          partnerTier: selected.partnerTier,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || "Could not submit request.");
      setMessage(payload.message || "Crew request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!selected) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="space-y-4">
        <div>
          <Badge>Crew Marketplace</Badge>
          <CardTitle className="mt-4 text-3xl">Book DJs, bartenders, shooters, and curators fast.</CardTitle>
          <CardDescription className="mt-3">
            Requests route through EVNTSZN with fee logic applied transparently at submission time.
          </CardDescription>
        </div>
        <div className="space-y-3">
          {members.map((member) => {
            const fee = calculateCrewBookingFee({
              subtotalUsd: member.priceFromUsd,
              category: member.category,
              partnerTier: member.partnerTier,
            });
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setSelectedId(member.id);
                  setBudgetUsd(String(member.priceFromUsd));
                }}
                className={`w-full rounded-2xl border p-4 text-left ${
                  member.id === selected.id ? "border-white bg-white text-black" : "border-white/10 bg-black/20 text-white/72"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black">{member.name}</div>
                    <div className="text-sm opacity-70">{member.category} · {member.city}, {member.state}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">from {formatUsd(member.priceFromUsd)}</div>
                    <div className="text-xs opacity-70">{fee.feeLabel}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm opacity-75">{member.headline}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <Input value={budgetUsd} onChange={(event) => setBudgetUsd(event.target.value)} type="number" min="0" />
          <Input placeholder="Your name" value={requesterName} onChange={(event) => setRequesterName(event.target.value)} />
          <Input placeholder="Your email" value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} />
          <Input placeholder="Event name" value={eventName} onChange={(event) => setEventName(event.target.value)} />
          <Input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} className="sm:col-span-2" />
        </div>
        <Textarea placeholder="What do you need covered?" value={notes} onChange={(event) => setNotes(event.target.value)} />

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">
          Subtotal {formatUsd(Number(budgetUsd || 0))} · {pricing.feeLabel} · Total {formatUsd(pricing.totalUsd)}
        </div>

        {message ? <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72">{message}</div> : null}

        <Button onClick={submitRequest} disabled={submitting || !requesterName || !requesterEmail} className="w-full">
          {submitting ? "Sending request..." : "Request booking"}
        </Button>
      </Card>
    </div>
  );
}
