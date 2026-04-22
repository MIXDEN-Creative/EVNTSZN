"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const BUDGET_RANGES = [
  "$1k-$2.5k",
  "$2.5k-$5k",
  "$5k-$10k",
  "$10k+",
] as const;

const INTEREST_OPTIONS = [
  { value: "events", label: "Events" },
  { value: "epl", label: "EPL" },
  { value: "pulse", label: "Pulse" },
  { value: "featured", label: "Featured placement" },
] as const;

export default function SponsorApplyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    budgetRange: String(BUDGET_RANGES[1]),
    targetCity: "",
    interests: ["events"] as string[],
    notes: "",
    requestInvoice: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/sponsors/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Could not submit sponsor application.");
      setSubmitting(false);
      return;
    }

    const search = new URLSearchParams({
      city: form.targetCity || "multi-city",
      budget: form.budgetRange,
      ...(form.requestInvoice ? { invoice: "1" } : {}),
    });
    router.push(`/sponsors/thank-you?${search.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-black/30 p-6 md:p-8">
      <div className="ev-section-kicker">Sponsor application</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Route your brand into the sponsor desk.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
        This application captures commercial budget, target market, and placement interests so EVNTSZN can move the sponsor into the right package, activation, or invoice flow.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
        <input className="ev-field" placeholder="Contact name" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} required />
        <input className="ev-field" type="email" placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} required />
        <input className="ev-field" placeholder="Contact phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
        <select className="ev-field" value={form.budgetRange} onChange={(event) => setForm({ ...form, budgetRange: event.target.value })}>
          {BUDGET_RANGES.map((range) => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
        <input className="ev-field" placeholder="Target city" value={form.targetCity} onChange={(event) => setForm({ ...form, targetCity: event.target.value })} required />
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Placement interests</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = form.interests.includes(interest.value);
            return (
              <button
                key={interest.value}
                type="button"
                onClick={() => toggleInterest(interest.value)}
                className={`rounded-[22px] border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-[#A259FF]/50 bg-[#A259FF]/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/68 hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        className="ev-textarea mt-6"
        rows={5}
        placeholder="Tell EVNTSZN what kind of event sponsorship, city activation, EPL presence, Pulse visibility, or featured placement you want."
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
        <span>Request invoice instead of direct package purchase if you want EVNTSZN to structure the commercial flow first.</span>
      </label>

      <button type="submit" disabled={submitting || !form.companyName || !form.contactName || !form.contactEmail || !form.targetCity || !form.interests.length} className="ev-button-primary mt-7 disabled:opacity-50">
        {submitting ? "Submitting..." : "Become a Sponsor"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
