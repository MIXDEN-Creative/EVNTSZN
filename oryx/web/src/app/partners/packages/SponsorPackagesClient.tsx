"use client";

import Link from "next/link";
import { useState } from "react";
import { formatUsd } from "@/lib/money";

type SponsorPackage = {
  id: string;
  package_name: string;
  description: string | null;
  cash_price_usd: number;
  benefits: string[] | null;
};

export default function SponsorPackagesClient({ packages }: { packages: SponsorPackage[] }) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function sendInquiry(pkg: SponsorPackage) {
    setLoadingId(pkg.id);
    setMessage("");

    const response = await fetch("/api/sponsors/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        packageId: pkg.id,
        packageName: pkg.package_name,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        notes,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "Could not submit sponsor inquiry.");
    } else {
      setMessage("Your sponsorship inquiry has been captured for review.");
    }

    setLoadingId(null);
  }

  async function submitGeneralInquiry() {
    setLoadingId("general");
    setMessage("");

    const response = await fetch("/api/sponsors/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        notes,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error || "Could not submit sponsor inquiry.");
    } else {
      setMessage("Your sponsor inquiry has been captured for review.");
    }

    setLoadingId(null);
  }

  async function purchasePackage(pkg: SponsorPackage) {
    setLoadingId(pkg.id);
    setMessage("");

    const response = await fetch("/api/sponsors/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        packageId: pkg.id,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
      }),
    });

    const data = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !data.url) {
      setMessage(data.error || "Could not create sponsor checkout.");
      setLoadingId(null);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <>
      <section className="ev-panel mt-8 p-6">
        <div className="ev-section-kicker">Sponsorship intake</div>
        <h2 className="mt-3 text-2xl font-bold text-white">Enter your sponsor contact details once.</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className="ev-field" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input className="ev-field" placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className="ev-field" type="email" placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <input className="ev-field" placeholder="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <textarea className="ev-textarea mt-4" rows={4} placeholder="What kind of sponsorship, city activation, or sponsor package are you exploring?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sponsors/apply" className="ev-button-secondary">
            Become a Sponsor
          </Link>
          <button
            type="button"
            onClick={submitGeneralInquiry}
            disabled={loadingId === "general" || !companyName || !contactEmail}
            className="ev-button-primary disabled:opacity-50"
          >
            {loadingId === "general" ? "Submitting..." : "Submit sponsor inquiry"}
          </button>
          <div className="text-sm leading-6 text-white/62">
            Use this if you want a sponsorship conversation first. Package-specific inquiry, direct purchase, and sponsor application still remain available below.
          </div>
        </div>
        {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {packages.map((pkg) => (
          <article key={pkg.id} className="ev-panel p-6">
            <div className="ev-section-kicker">Package</div>
            <div className="mt-3 text-2xl font-black text-white">{pkg.package_name}</div>
            <div className="mt-3 text-sm leading-6 text-white/70">{pkg.description || "Premium brand visibility across EVNTSZN and EPL."}</div>
            <div className="mt-5 text-4xl font-black text-white">{formatUsd(pkg.cash_price_usd)}</div>
            <ul className="mt-5 space-y-2 text-sm text-white/72">
              {Array.isArray(pkg.benefits) && pkg.benefits.length
                ? pkg.benefits.map((benefit) => (
                    <li key={benefit} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                      {benefit}
                    </li>
                  ))
                : <li className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">Package details are managed in the sponsor dashboard.</li>}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => sendInquiry(pkg)}
                disabled={loadingId === pkg.id || !companyName || !contactEmail}
                className="ev-button-secondary disabled:opacity-50"
              >
                {loadingId === pkg.id ? "Submitting..." : "Inquire"}
              </button>
              <button
                type="button"
                onClick={() => purchasePackage(pkg)}
                disabled={loadingId === pkg.id || !companyName || !contactEmail}
                className="ev-button-primary disabled:opacity-50"
              >
                {loadingId === pkg.id ? "Redirecting..." : "Purchase package"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
