"use client";

import { useState } from "react";

export default function BookingRequestForm({
  crewProfileId,
  crewName,
  bookingFeeUsd,
}: {
  crewProfileId: string;
  crewName: string;
  bookingFeeUsd?: number | null;
}) {
  const [form, setForm] = useState({
    requestedByName: "",
    requestedByEmail: "",
    requestedByPhone: "",
    requestedRole: "",
    eventName: "",
    eventDate: "",
    city: "",
    state: "",
    eventType: "",
    category: "",
    duration: "",
    equipmentNotes: "",
    audienceSize: "",
    specialRequirements: "",
    message: "",
    budgetAmount: "",
  });
  const [bookingFeeAccepted, setBookingFeeAccepted] = useState(false);
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
        budgetAmountUsd: form.budgetAmount ? Math.round(Number(form.budgetAmount) * 100) : null,
        bookingFeeAccepted,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not submit booking request.");
    } else {
      const confirmedFee =
        bookingFeeUsd && bookingFeeUsd > 0
          ? `$${Number(bookingFeeUsd).toFixed(2)}`
          : form.budgetAmount
            ? `$${(Number(form.budgetAmount) * 0.1).toFixed(2)}`
            : "the standard 10% EVNTSZN booking fee";
      setMessage(`Booking request sent to ${crewName}. If accepted, EVNTSZN will route the job with ${confirmedFee}.`);
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
        eventType: "",
        category: "",
        duration: "",
        equipmentNotes: "",
        audienceSize: "",
        specialRequirements: "",
        message: "",
        budgetAmount: "",
      });
      setBookingFeeAccepted(false);
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="ev-panel p-6 md:p-8 lg:p-10">
      <div className="ev-section-kicker">Request booking</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Send a real booking request.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">
        Share the role, date, market, and scope clearly so the crew profile owner can accept or decline without back-and-forth. EVNTSZN applies a 10% marketplace booking fee unless a flat crew fee has already been set for this profile.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Your name" value={form.requestedByName} onChange={(event) => setForm({ ...form, requestedByName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Your email" value={form.requestedByEmail} onChange={(event) => setForm({ ...form, requestedByEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Phone" value={form.requestedByPhone} onChange={(event) => setForm({ ...form, requestedByPhone: event.target.value })} />
        <input className="ev-field" placeholder="Role needed" value={form.requestedRole} onChange={(event) => setForm({ ...form, requestedRole: event.target.value })} required />
        <input className="ev-field" placeholder="Event name" value={form.eventName} onChange={(event) => setForm({ ...form, eventName: event.target.value })} />
        <input className="ev-field" type="datetime-local" value={form.eventDate} onChange={(event) => setForm({ ...form, eventDate: event.target.value })} />
        <input className="ev-field" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <input className="ev-field" placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
        <input className="ev-field" placeholder="Event type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })} />
        <input className="ev-field" placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
        <input className="ev-field" placeholder="Budget in dollars" value={form.budgetAmount} onChange={(event) => setForm({ ...form, budgetAmount: event.target.value })} />
        <input className="ev-field" placeholder="Duration" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
        <input className="ev-field md:col-span-2" placeholder="Audience size" value={form.audienceSize} onChange={(event) => setForm({ ...form, audienceSize: event.target.value })} />
        <textarea className="ev-textarea md:col-span-2" rows={4} placeholder="Equipment or setup notes" value={form.equipmentNotes} onChange={(event) => setForm({ ...form, equipmentNotes: event.target.value })} />
        <textarea className="ev-textarea md:col-span-2" rows={4} placeholder="Special requirements" value={form.specialRequirements} onChange={(event) => setForm({ ...form, specialRequirements: event.target.value })} />
        <textarea className="ev-textarea md:col-span-2" rows={5} placeholder="What do you need this person to handle?" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/72">
        <input
          type="checkbox"
          checked={bookingFeeAccepted}
          onChange={(event) => setBookingFeeAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#A259FF]"
          required
        />
        <span>
          {bookingFeeUsd && bookingFeeUsd > 0
            ? `I understand this profile carries a $${Number(bookingFeeUsd).toFixed(2)} crew booking fee if the request is accepted.`
            : form.budgetAmount
              ? `I understand EVNTSZN will apply an estimated 10% booking fee of $${(Number(form.budgetAmount || 0) * 0.1).toFixed(2)} if this request is accepted.`
              : "I understand EVNTSZN applies a 10% booking fee if this request is accepted."}
        </span>
      </label>
      <button type="submit" disabled={submitting} className={`ev-button-primary mt-7 w-full md:w-auto ${sentFlash ? "scale-[1.02]" : ""}`}>
        {submitting ? "Sending..." : "Send booking request"}
      </button>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">{message}</div> : null}
    </form>
  );
}
