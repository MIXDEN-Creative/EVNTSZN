"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

export default function InternalAccessForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const nextPath = normalizeNextPath(next);
    const accessCheck = await fetch("/api/admin/internal-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, next: nextPath }),
    });

    const accessJson = (await accessCheck.json().catch(() => ({}))) as { error?: string };
    if (!accessCheck.ok) {
      setMessage(accessJson.error || "Internal access is not available for that email.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = `${redirectOrigin}${nextPath}`;
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="ev-panel border-white/12 bg-white/[0.02]">
      <div className="ev-section-kicker">Invited staff access</div>
      <h2 className="ev-panel-title mt-3">Sign in with your invited internal email</h2>
      <p className="ev-panel-copy">
        Admin, HQ, ops, scanner, and office access only open for invited accounts with active internal roles. This is a password sign-in for internal tools, not an attendee account flow.
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

      <div className="mt-4">
        <label className="mb-2 block text-sm text-white/70">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="ev-field"
          placeholder="Your internal account password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="ev-button-primary mt-6 w-full disabled:opacity-50">
        {loading ? "Signing in..." : "Sign in to internal tools"}
      </button>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
          {message}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/58">
        <span>New internal users should open their invite email first to claim access and set their password.</span>
        <Link href="/admin-login/recover" className="text-[#d8c2ff] hover:text-white">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
