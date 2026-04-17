"use client";

import { useState } from "react";
import Link from "next/link";

type ErrorPayload = {
  error?: string;
  message?: string;
};

const FOUNDER_EMAIL = "hello@mixdencreative.com";

export default function InternalAccessForm({ next = "/admin" }: { next?: string }) {
  const [email, setEmail] = useState("hello@mixdencreative.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const endpoint =
        normalizedEmail === FOUNDER_EMAIL ? "/api/founder/login" : "/api/admin/internal-access";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          next,
        }),
      });

      if (res.ok) {
        if (normalizedEmail === FOUNDER_EMAIL) {
          const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
          window.location.replace(data.redirectTo || next);
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };
        window.location.replace(data.redirectTo || next);
        return;
      }

      let data: ErrorPayload = {};
      try {
        data = (await res.json()) as ErrorPayload;
      } catch {
        data = {};
      }

      throw new Error(data.error || data.message || "Internal sign-in failed.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during sign-in.";
      console.error("Internal sign-in error:", err);
      setErrorMessage(message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="internal-email"
          className="block text-sm font-medium text-white/75"
        >
          Invited email
        </label>
        <input
          id="internal-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/10"
          placeholder="hello@mixdencreative.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="internal-password"
          className="block text-sm font-medium text-white/75"
        >
          Password
        </label>
        <input
          id="internal-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/10"
          placeholder="Enter your password"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {email.trim().toLowerCase() === FOUNDER_EMAIL ? (
        <div className="rounded-2xl border border-[#A259FF]/20 bg-[#A259FF]/10 px-4 py-3 text-sm text-[#eadcff]">
          Founder email uses the runtime-backed founder secret path and sets the signed founder session directly.
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-xs leading-6 text-white/45">
        New internal users should open their invite email first to claim access
        and set their password.
      </p>

      <Link
        href="/admin-login/recover"
        className="inline-block text-sm font-medium text-[#c084fc] transition hover:text-white"
      >
        Forgot password?
      </Link>
    </form>
  );
}
