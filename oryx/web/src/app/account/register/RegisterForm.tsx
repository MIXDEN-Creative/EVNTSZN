"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAppOrigin, getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

type RegisterFormProps = {
  next: string;
};

export default function RegisterForm({ next }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient();
    const nextPath = normalizeNextPath(next);
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
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
      setMessageTone("success");
      setMessage("Account created. Please check your email for a confirmation link before signing in.");
    }

    setLoading(false);
  }

  return (
    <div className="ev-panel">
      <form onSubmit={handleRegister}>
        <div className="ev-section-kicker">Member Access</div>
        <h2 className="ev-panel-title mt-3">Create your account</h2>
        <p className="ev-panel-copy">
          Join EVNTSZN to track your tickets, saved events, and league activity.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-white/70">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="ev-field"
            placeholder="How your account should appear"
            required
            autoComplete="name"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-white/70">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ev-field"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-white/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ev-field"
            placeholder="Minimum 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ev-button-primary mt-8 w-full disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create member account"}
        </button>

        {message ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${
            messageTone === "success" 
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" 
              : "border-red-500/20 bg-red-500/5 text-red-200"
          }`}>
            {message}
          </div>
        ) : null}
      </form>

      <div className="mt-8 border-t border-white/10 pt-8">
        <div className="text-center">
          <p className="text-sm text-white/50">Already have an account?</p>
          <Link
            href={`${getAppOrigin()}/account/login?next=${encodeURIComponent(next)}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Sign in to account
          </Link>
        </div>
      </div>
    </div>
  );
}
