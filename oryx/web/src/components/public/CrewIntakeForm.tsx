"use client";

import { useMemo, useState } from "react";
import { CREW_CATEGORIES, getCrewCategoryLabel } from "@/lib/platform-products";

const EVENT_TYPES = [
  "Nightlife event",
  "Concert",
  "Private party",
  "Pop-up",
  "Brand activation",
  "Comedy night",
  "Food event",
  "League event",
] as const;

export default function CrewIntakeForm() {
  const [form, setForm] = useState<{
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    operatorType: string;
    city: string;
    eventDate: string;
    eventType: (typeof EVENT_TYPES)[number];
    category: string;
    budget: string;
    duration: string;
    audienceSize: string;
    equipmentNotes: string;
    specialRequirements: string;
  }>({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    operatorType: "independent_organizer",
    city: "",
    eventDate: "",
    eventType: EVENT_TYPES[0],
    category: "dj",
    budget: "",
    duration: "",
    audienceSize: "",
    equipmentNotes: "",
    specialRequirements: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(
    () => CREW_CATEGORIES.filter((entry) => entry !== "custom"),
    [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/public/crew-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || "Could not submit the crew brief.");
      setSubmitting(false);
      return;
    }

    setMessage("Crew booking brief submitted. EVNTSZN can now route the request through the marketplace.");
    setSubmitting(false);
    setForm({
      requesterName: "",
      requesterEmail: "",
      requesterPhone: "",
      operatorType: "independent_organizer",
      city: "",
      eventDate: "",
      eventType: EVENT_TYPES[0],
      category: "dj",
      budget: "",
      duration: "",
      audienceSize: "",
      equipmentNotes: "",
      specialRequirements: "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel p-6 md:p-8">
      <div className="ev-section-kicker">Book talent</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Send a structured booking brief.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
        Use this when you need EVNTSZN to route the right DJs, photographers, bartenders, hosts, or performers to your event. Hosts and Independent Organizers can use the same intake.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          className="ev-field"
          placeholder="Your name"
          value={form.requesterName}
          onChange={(event) => setForm({ ...form, requesterName: event.target.value })}
          required
        />
        <input
          className="ev-field"
          type="email"
          placeholder="Your email"
          value={form.requesterEmail}
          onChange={(event) => setForm({ ...form, requesterEmail: event.target.value })}
          required
        />
        <input
          className="ev-field"
          placeholder="Phone"
          value={form.requesterPhone}
          onChange={(event) => setForm({ ...form, requesterPhone: event.target.value })}
        />
        <select
          className="ev-field"
          value={form.operatorType}
          onChange={(event) => setForm({ ...form, operatorType: event.target.value })}
        >
          <option value="independent_organizer">Independent Organizer</option>
          <option value="host">EVNTSZN Host</option>
          <option value="venue">Venue team</option>
          <option value="brand">Brand / sponsor</option>
        </select>
        <input
          className="ev-field"
          placeholder="City"
          value={form.city}
          onChange={(event) => setForm({ ...form, city: event.target.value })}
          required
        />
        <input
          className="ev-field"
          type="date"
          value={form.eventDate}
          onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
          required
        />
        <select
          className="ev-field"
          value={form.eventType}
          onChange={(event) => setForm({ ...form, eventType: event.target.value as (typeof EVENT_TYPES)[number] })}
        >
          {EVENT_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          className="ev-field"
          value={form.category}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {getCrewCategoryLabel(option)}
            </option>
          ))}
        </select>
        <input
          className="ev-field"
          placeholder="Budget"
          value={form.budget}
          onChange={(event) => setForm({ ...form, budget: event.target.value })}
          required
        />
        <input
          className="ev-field"
          placeholder="Duration"
          value={form.duration}
          onChange={(event) => setForm({ ...form, duration: event.target.value })}
          required
        />
        <input
          className="ev-field md:col-span-2"
          placeholder="Audience size"
          value={form.audienceSize}
          onChange={(event) => setForm({ ...form, audienceSize: event.target.value })}
          required
        />
        <textarea
          className="ev-textarea md:col-span-2"
          rows={4}
          placeholder="Equipment or setup notes"
          value={form.equipmentNotes}
          onChange={(event) => setForm({ ...form, equipmentNotes: event.target.value })}
        />
        <textarea
          className="ev-textarea md:col-span-2"
          rows={5}
          placeholder="Special requirements, vibe direction, or anything the booking desk should know"
          value={form.specialRequirements}
          onChange={(event) => setForm({ ...form, specialRequirements: event.target.value })}
        />
      </div>

      <button type="submit" disabled={submitting} className="ev-button-primary mt-7">
        {submitting ? "Sending brief..." : "Submit booking brief"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
