"use client";

import { useState } from "react";

export default function FounderLoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("hello@mixdencreative.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/founder/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, next }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      redirectTo?: string;
    };

    if (!response.ok || !data.redirectTo) {
      setMessage(data.error || "Founder access could not be verified.");
      setLoading(false);
      return;
    }

    window.location.href = data.redirectTo;
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel border-white/12 bg-white/[0.02]">
      <div className="ev-section-kicker">Founder access</div>
      <h2 className="ev-panel-title mt-3">Secure command-center override</h2>
      <p className="ev-panel-copy">
        Use the founder credential for HQ, admin, scanner, and ops access when you need full-system override across EVNTSZN and EPL.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm text-white/70">Founder email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ev-field"
          autoComplete="username"
          required
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm text-white/70">Access password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="ev-field"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="ev-button-secondary mt-6 w-full disabled:opacity-50"
      >
        {loading ? "Verifying founder access..." : "Enter command center"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {message}
        </div>
      ) : null}
    </form>
  );
}
