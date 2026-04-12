"use client";

import { useState } from "react";

export default function LeadCaptureForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/evntszn/link/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, email }),
    });

    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save your email.");
    } else {
      setMessage("You’re on the list.");
      setEmail("");
      setName("");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submitLead} className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03)),rgba(0,0,0,0.34)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.32)] md:p-8">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Email capture</div>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Keep the next drop in your inbox.</h2>
      <p className="mt-3 text-sm leading-6 text-white/68">
        Join the host list for ticket links, event drops, offers, and direct updates.
      </p>

      <div className="mt-6 grid gap-3">
        <input
          className="ev-field"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="ev-field"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <button
          type="submit"
          disabled={submitting}
          className="ev-button-primary mt-6 w-full disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Join this list"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/74">{message}</div>
      ) : null}
    </form>
  );
}
