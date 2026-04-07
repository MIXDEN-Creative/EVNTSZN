"use client";

import { useState } from "react";

export default function ProgramApplicationForm({ programKey }: { programKey: "signal" | "ambassador" }) {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    role_tags: "",
    notes: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/programs/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_key: programKey,
        ...form,
        role_tags: form.role_tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(json.error || `Could not submit your ${programKey} request right now.`);
      return;
    }
    setMessage(`Your ${programKey} request has been submitted for review.`);
    setForm({
      full_name: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      role_tags: "",
      notes: "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel grid gap-4 p-6">
      {message ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input className="ev-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <input className="ev-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="ev-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="ev-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
      </div>
      <input className="ev-field" placeholder="Tags or strengths (comma separated)" value={form.role_tags} onChange={(e) => setForm({ ...form, role_tags: e.target.value })} />
      <textarea className="ev-textarea" rows={4} placeholder="Why you want to join and how you can help" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button type="submit" className="ev-button-primary">Submit request</button>
    </form>
  );
}
