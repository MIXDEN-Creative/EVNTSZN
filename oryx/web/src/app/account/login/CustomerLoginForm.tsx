"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

type CustomerLoginFormProps = {
  next: string;
};

export default function CustomerLoginForm({ next }: CustomerLoginFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const nextPath = normalizeNextPath(next);
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for your sign-in link.");
    }

    setLoading(false);
  }

  return (
    <main className="ev-surface ev-surface--app grid min-h-screen place-items-center px-6 py-10 text-white">
      <div className="relative z-10 grid w-full max-w-5xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <section className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">Member sign-in</div>
              <h1 className="ev-title">Access your premium EVNTSZN account.</h1>
              <p className="ev-subtitle">
                Tickets, rewards, orders, and member access all route through the app surface with a clean handoff back to your intended destination.
              </p>
            </div>
            <div className="ev-hero-meta">
              <div className="ev-meta-card">
                <div className="ev-meta-label">Sign-in method</div>
                <div className="ev-meta-value">Magic link email access with destination-aware redirection across EVNTSZN surfaces.</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Destination preserved</div>
                <div className="ev-meta-value">{next}</div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleLogin} className="ev-panel">
          <div className="ev-section-kicker">Secure entry</div>
          <h2 className="ev-panel-title mt-3">Email me a sign-in link</h2>
          <p className="ev-panel-copy">Use the same address tied to your EVNTSZN membership, tickets, or operator access.</p>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-white/70">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ev-field"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ev-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ev-button-primary mt-6 w-full disabled:opacity-50"
          >
            {loading ? "Sending..." : "Email Me a Login Link"}
          </button>

          {message ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
