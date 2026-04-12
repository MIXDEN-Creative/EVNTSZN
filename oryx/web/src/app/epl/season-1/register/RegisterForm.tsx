"use client";

import { useState } from "react";
import { JERSEY_NAME_DISCLAIMER } from "@/lib/epl/constants";
import { getBaseWaiverUrl } from "@/lib/epl/waiver";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  city: string;
  state: string;
  positionPrimary: string;
  positionSecondary: string;
  experienceLevel: string;
  jerseyNameRequested: string;
  preferredJerseyNumber1: string;
  preferredJerseyNumber2: string;
  jerseyNamePolicyAccepted: boolean;
  headshot: File | null;
};

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  age: "",
  city: "",
  state: "",
  positionPrimary: "",
  positionSecondary: "",
  experienceLevel: "",
  jerseyNameRequested: "",
  preferredJerseyNumber1: "",
  preferredJerseyNumber2: "",
  jerseyNamePolicyAccepted: false,
  headshot: null,
};

const WAIVER_URL = getBaseWaiverUrl();

type RegistrationResponse = {
  error?: string;
  checkoutUrl?: string;
};

function inputClassName() {
  return "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#A259FF] focus:bg-white/[0.07]";
}

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.jerseyNamePolicyAccepted) {
      setError("Please confirm the jersey name policy.");
      return;
    }

    if (
      form.preferredJerseyNumber1 &&
      form.preferredJerseyNumber2 &&
      form.preferredJerseyNumber1 === form.preferredJerseyNumber2
    ) {
      setError("Preferred jersey numbers must be different.");
      return;
    }

    try {
      setSubmitting(true);

      const body = new FormData();
      body.append("firstName", form.firstName);
      body.append("lastName", form.lastName);
      body.append("email", form.email);
      body.append("phone", form.phone);
      body.append("age", form.age);
      body.append("city", form.city);
      body.append("state", form.state);
      body.append("positionPrimary", form.positionPrimary);
      body.append("positionSecondary", form.positionSecondary);
      body.append("experienceLevel", form.experienceLevel);
      body.append("jerseyNameRequested", form.jerseyNameRequested);
      body.append("preferredJerseyNumber1", form.preferredJerseyNumber1);
      body.append("preferredJerseyNumber2", form.preferredJerseyNumber2);
      body.append("jerseyNamePolicyAccepted", String(form.jerseyNamePolicyAccepted));

      if (form.headshot) {
        body.append("headshot", form.headshot);
      }

      const res = await fetch("/api/epl/registrations", {
        method: "POST",
        body,
      });

      const json = (await res.json()) as RegistrationResponse;

      if (!res.ok) {
        throw new Error(json.error || "Registration failed.");
      }

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      throw new Error("Checkout URL not returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setSubmitting(false);
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-3 md:grid-cols-5">
        {[
          "Player details",
          "Football fit",
          "Headshot",
          "Jersey details",
          "Waiver",
        ].map((step, index) => (
          <div key={step} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Step {index + 1}</div>
            <div className="mt-2 text-sm font-semibold text-white">{step}</div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Step 1</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Player details</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/58">Start with the basics so the league office can build your profile, verify eligibility, and keep your registration moving.</p>
        </div>
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/62">
            Use your real contact info. League updates, payment follow-up, and draft-night communication all follow this record.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/62">
            This registration is for coed adult flag football. It feeds the live draftboard, team builds, and season operations after approval.
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">First Name</label>
            <input className={inputClassName()} autoComplete="given-name" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">Last Name</label>
            <input className={inputClassName()} autoComplete="family-name" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">Email</label>
            <input className={inputClassName()} autoComplete="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">Phone</label>
            <input className={inputClassName()} autoComplete="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">Age</label>
            <input className={inputClassName()} type="number" min="16" max="70" value={form.age} onChange={(e) => setField("age", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">City</label>
            <input className={inputClassName()} autoComplete="address-level2" value={form.city} onChange={(e) => setField("city", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">State</label>
            <input className={inputClassName()} autoComplete="address-level1" value={form.state} onChange={(e) => setField("state", e.target.value)} required />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55 font-bold">Experience Level</label>
            <input className={inputClassName()} placeholder="Beginner, recreational, competitive, etc." value={form.experienceLevel} onChange={(e) => setField("experienceLevel", e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Step 2</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Football fit</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/58">These spots feed the draft pool and help the league office balance clubs around what each team actually needs on draft night.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55">Primary Position</label>
            <input className={inputClassName()} placeholder="QB, WR, DB, etc." value={form.positionPrimary} onChange={(e) => setField("positionPrimary", e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55">Secondary Position</label>
            <input className={inputClassName()} placeholder="Optional" value={form.positionSecondary} onChange={(e) => setField("positionSecondary", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Step 3</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Upload your headshot</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/58">Use a clear player photo so your registration, draft pool entry, and league profile are easy to review.</p>
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setField("headshot", e.target.files?.[0] || null)}
          className="block w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#A259FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />

        <p className="mt-3 text-sm text-white/55">
          Upload a clear player photo in JPG, PNG, or WEBP format.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Step 4</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Lock in your player identity</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/58">Jersey details stay with your player file through review, assignment, and season production.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55">Jersey Name</label>
            <input
              className={inputClassName()}
              maxLength={24}
              value={form.jerseyNameRequested}
              onChange={(e) => setField("jerseyNameRequested", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55">Preferred Number 1</label>
            <input
              className={inputClassName()}
              type="number"
              min="0"
              max="99"
              value={form.preferredJerseyNumber1}
              onChange={(e) => setField("preferredJerseyNumber1", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/55">Preferred Number 2</label>
            <input
              className={inputClassName()}
              type="number"
              min="0"
              max="99"
              value={form.preferredJerseyNumber2}
              onChange={(e) => setField("preferredJerseyNumber2", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
          {JERSEY_NAME_DISCLAIMER}
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <input
            type="checkbox"
            checked={form.jerseyNamePolicyAccepted}
            onChange={(e) => setField("jerseyNamePolicyAccepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-black text-[#A259FF] focus:ring-[#A259FF]"
          />
          <span className="text-sm text-white/80">
            I understand the jersey name policy and confirm that my requested jersey name follows it.
          </span>
        </label>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Step 5</p>
          <h3 className="mt-2 text-xl font-semibold text-white">League waiver</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/58">
            Registration and payment put you into the player pool. Finish the waiver right after checkout so your file is ready for review and draft-night prep.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/75">
            Waiver link: <span className="text-white">{WAIVER_URL}</span>
          </div>
          <a
            href={WAIVER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
          >
            Open waiver
          </a>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-white/52">
          You will go to secure checkout after this step. The waiver stays available after registration.
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#A259FF] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Redirecting to checkout..." : "Continue to registration checkout"}
        </button>
      </div>
    </form>
  );
}
