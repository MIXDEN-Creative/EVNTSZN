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
    <form onSubmit={handleLogin} className="ev-panel">
      <div className="ev-section-kicker">Secure entry</div>
      <h2 className="ev-panel-title mt-3">Sign in with your EVNTSZN email</h2>
      <p className="ev-panel-copy">
        Use the same address tied to your tickets, rewards, orders, or approved staff access. We will send you a secure sign-in link and route you back where you were headed.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm text-white/70">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="ev-field"
          placeholder="How your account should appear"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm text-white/70">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="ev-field"
          placeholder="you@example.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="ev-button-primary mt-6 w-full disabled:opacity-50"
      >
        {loading ? "Sending secure access..." : "Send secure access link"}
      </button>

      <div className="mt-4 text-sm text-white/52">
        Destination after sign-in: <span className="text-white/78">{next}</span>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
          {message}
        </div>
      ) : null}
    </form>
  );
}
