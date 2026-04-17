"use client";

import { useState } from "react";

export default function VenueAgreementForm({
  defaultIntent = "venue-agreement",
}: {
  defaultIntent?: string;
}) {
  const [form, setForm] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    operatorLevel: "host",
    market: "",
    venueName: "",
    venueListed: "yes",
    venueWebsite: "",
    venueContactName: "",
    venueContactEmail: "",
    venueContactPhone: "",
    useCase: defaultIntent,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/public/venue-agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || "Could not submit the venue agreement request.");
      setSubmitting(false);
      return;
    }

    setMessage("Venue agreement request submitted. EVNTSZN can now route the approval and venue paperwork flow.");
    setSubmitting(false);
    setForm({
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      operatorLevel: "host",
      market: "",
      venueName: "",
      venueListed: "yes",
      venueWebsite: "",
      venueContactName: "",
      venueContactEmail: "",
      venueContactPhone: "",
      useCase: defaultIntent,
      notes: "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel p-6 md:p-8">
      <div className="ev-section-kicker">Venue agreement workflow</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Complete the venue agreement on-platform.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
        Use this intake when the venue is not already listed on EVNTSZN, when a written venue agreement is required, or when a curator and venue need the agreement routed for approval.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Applicant name" value={form.applicantName} onChange={(event) => setForm({ ...form, applicantName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Applicant email" value={form.applicantEmail} onChange={(event) => setForm({ ...form, applicantEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Applicant phone" value={form.applicantPhone} onChange={(event) => setForm({ ...form, applicantPhone: event.target.value })} />
        <select className="ev-field" value={form.operatorLevel} onChange={(event) => setForm({ ...form, operatorLevel: event.target.value })}>
          <option value="host">Curator</option>
          <option value="certified_host">Certified Curator</option>
          <option value="pro_host">Pro Curator</option>
          <option value="city_leader">City Leader</option>
          <option value="venue">Venue team</option>
        </select>
        <input className="ev-field" placeholder="Market" value={form.market} onChange={(event) => setForm({ ...form, market: event.target.value })} required />
        <input className="ev-field" placeholder="Venue name" value={form.venueName} onChange={(event) => setForm({ ...form, venueName: event.target.value })} required />
        <select className="ev-field" value={form.venueListed} onChange={(event) => setForm({ ...form, venueListed: event.target.value })}>
          <option value="yes">Venue is already listed on EVNTSZN</option>
          <option value="no">Venue is not listed on EVNTSZN</option>
        </select>
        <input className="ev-field" placeholder="Venue website" value={form.venueWebsite} onChange={(event) => setForm({ ...form, venueWebsite: event.target.value })} />
        <input className="ev-field" placeholder="Venue contact name" value={form.venueContactName} onChange={(event) => setForm({ ...form, venueContactName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Venue contact email" value={form.venueContactEmail} onChange={(event) => setForm({ ...form, venueContactEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Venue contact phone" value={form.venueContactPhone} onChange={(event) => setForm({ ...form, venueContactPhone: event.target.value })} />
        <input className="ev-field md:col-span-2" placeholder="Use case" value={form.useCase} onChange={(event) => setForm({ ...form, useCase: event.target.value })} />
        <textarea className="ev-textarea md:col-span-2" rows={5} placeholder="Approval notes, operating plan, or agreement context" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </div>

      <button type="submit" disabled={submitting} className="ev-button-primary mt-7">
        {submitting ? "Submitting..." : "Submit venue agreement"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
