"use client";

import { useState } from "react";

export default function BookingRequestForm({ crewProfileId, crewName }: { crewProfileId: string; crewName: string }) {
  const [form, setForm] = useState({
    requestedByName: "",
    requestedByEmail: "",
    requestedByPhone: "",
    requestedRole: "",
    eventName: "",
    eventDate: "",
    city: "",
    state: "",
    message: "",
    budgetAmountCents: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await fetch("/api/evntszn/crew/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        crewProfileId,
        budgetAmountCents: form.budgetAmountCents ? Number(form.budgetAmountCents) : null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not submit booking request.");
    } else {
      setMessage(`Booking request sent to ${crewName}.`);
      setSentFlash(true);
      window.setTimeout(() => setSentFlash(false), 900);
      setForm({
        requestedByName: "",
        requestedByEmail: "",
        requestedByPhone: "",
        requestedRole: "",
        eventName: "",
        eventDate: "",
        city: "",
        state: "",
        message: "",
        budgetAmountCents: "",
      });
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="ev-panel p-6 md:p-8 lg:p-10">
      <div className="ev-section-kicker">Request booking</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Send a real booking request.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">
        Share the role, date, market, and scope clearly so the crew profile owner can accept or decline without back-and-forth.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Your name" value={form.requestedByName} onChange={(event) => setForm({ ...form, requestedByName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Your email" value={form.requestedByEmail} onChange={(event) => setForm({ ...form, requestedByEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Phone" value={form.requestedByPhone} onChange={(event) => setForm({ ...form, requestedByPhone: event.target.value })} />
        <input className="ev-field" placeholder="Role needed" value={form.requestedRole} onChange={(event) => setForm({ ...form, requestedRole: event.target.value })} />
        <input className="ev-field" placeholder="Event name" value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} />
        <input className="ev-field" type="datetime-local" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
        <input className="ev-field" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <input className="ev-field" placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
        <input className="ev-field md:col-span-2" placeholder="Budget cents (optional)" value={form.budgetAmountCents} onChange={(event) => setForm({ ...form, budgetAmountCents: event.target.value })} />
        <textarea className="ev-textarea md:col-span-2" rows={5} placeholder="What do you need this person to handle?" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      </div>
      <button type="submit" disabled={submitting} className={`ev-button-primary mt-7 w-full md:w-auto ${sentFlash ? "scale-[1.02]" : ""}`}>
        {submitting ? "Sending..." : "Send booking request"}
      </button>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">{message}</div> : null}
    </form>
  );
}
