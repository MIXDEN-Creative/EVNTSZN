"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROPERTY_TYPES = [
  "Apartment",
  "Townhome",
  "Single-family",
  "Luxury condo",
  "Multi-unit",
  "Boutique stay",
] as const;

const TIER_OPTIONS = [
  { value: "15", label: "Core Ops · 15%" },
  { value: "20", label: "Pro Ops · 20%" },
  { value: "30", label: "Elite / Concierge · 30%" },
] as const;

const ADD_ON_OPTIONS = [
  "Listing setup",
  "Photography",
  "Furnishing/design",
  "Event packages",
] as const;

export default function StayOpsIntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    propertyType: String(PROPERTY_TYPES[0]),
    location: "",
    expectedRevenue: "",
    serviceTier: "20",
    notes: "",
    requestInvoice: false,
    addOns: [] as string[],
  });
  const [submitting, setSubmitting] = useState<"review" | "onboarding" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function toggleAddOn(addOn: string) {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.includes(addOn)
        ? current.addOns.filter((item) => item !== addOn)
        : [...current.addOns, addOn],
    }));
  }

  async function handleSubmit(nextStep: "review" | "onboarding") {
    setSubmitting(nextStep);
    setMessage(null);

    const response = await fetch("/api/stayops/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        nextStep,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string; intakeId?: string };
    if (!response.ok) {
      setMessage(payload.error || "Could not submit the StayOps intake.");
      setSubmitting(null);
      return;
    }

    const search = new URLSearchParams({
      mode: nextStep,
      tier: form.serviceTier,
      ...(form.requestInvoice ? { invoice: "1" } : {}),
      ...(payload.intakeId ? { intake: payload.intakeId } : {}),
    });
    router.push(`/stayops/confirmation?${search.toString()}`);
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-black/30 p-6 md:p-8">
      <div className="ev-section-kicker">StayOps intake</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Route your property into revenue operations.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
        This intake captures property type, market, expected revenue, service tier, and add-ons so EVNTSZN can review the asset and move you into the right operating lane.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Contact name" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Contact phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
        <input className="ev-field" placeholder="Owner or company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
        <select className="ev-field" value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })}>
          {PROPERTY_TYPES.map((propertyType) => (
            <option key={propertyType} value={propertyType}>{propertyType}</option>
          ))}
        </select>
        <input className="ev-field" placeholder="Property location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
        <input className="ev-field" placeholder="Expected monthly revenue or nightly pricing" value={form.expectedRevenue} onChange={(event) => setForm({ ...form, expectedRevenue: event.target.value })} required />
        <select className="ev-field" value={form.serviceTier} onChange={(event) => setForm({ ...form, serviceTier: event.target.value })}>
          {TIER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Add-ons</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {ADD_ON_OPTIONS.map((addOn) => {
            const active = form.addOns.includes(addOn);
            return (
              <button
                key={addOn}
                type="button"
                onClick={() => toggleAddOn(addOn)}
                className={`rounded-[22px] border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-[#A259FF]/50 bg-[#A259FF]/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/68 hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                {addOn}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        className="ev-textarea mt-6"
        rows={5}
        placeholder="Property details, current stack, occupancy profile, or event-linked demand goals"
        value={form.notes}
        onChange={(event) => setForm({ ...form, notes: event.target.value })}
      />

      <label className="mt-5 flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.requestInvoice}
          onChange={(event) => setForm({ ...form, requestInvoice: event.target.checked })}
        />
        <span>
          Request invoice placeholder for setup fee or add-ons during onboarding. This keeps the payment lane open without blocking intake.
        </span>
      </label>

      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={Boolean(submitting) || !form.contactName || !form.contactEmail || !form.companyName || !form.location || !form.expectedRevenue}
          onClick={() => handleSubmit("review")}
          className="ev-button-primary disabled:opacity-50"
        >
          {submitting === "review" ? "Submitting..." : "We'll review & onboard you"}
        </button>
        <button
          type="button"
          disabled={Boolean(submitting) || !form.contactName || !form.contactEmail || !form.companyName || !form.location || !form.expectedRevenue}
          onClick={() => handleSubmit("onboarding")}
          className="ev-button-secondary disabled:opacity-50"
        >
          {submitting === "onboarding" ? "Submitting..." : "Proceed to onboarding"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </div>
  );
}
