"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

export default function InternalAccessForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const accessCheck = await fetch("/api/admin/internal-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const accessJson = (await accessCheck.json().catch(() => ({}))) as { error?: string };
    if (!accessCheck.ok) {
      setMessage(accessJson.error || "Internal access is not available for that email.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const nextPath = normalizeNextPath(next);
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the secure internal access link.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel border-white/12 bg-white/[0.02]">
      <div className="ev-section-kicker">Invited staff access</div>
      <h2 className="ev-panel-title mt-3">Sign in with your invited internal email</h2>
      <p className="ev-panel-copy">
        Admin, HQ, ops, scanner, and office access only open for emails that already have assigned internal roles. This does not grant access by itself.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm text-white/70">Invited email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="ev-field"
          placeholder="you@evntszn.com"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="ev-button-primary mt-6 w-full disabled:opacity-50">
        {loading ? "Sending secure access..." : "Send internal access link"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
