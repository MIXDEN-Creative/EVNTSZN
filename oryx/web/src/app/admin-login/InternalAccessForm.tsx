"use client";

import { useState } from "react";

type LoginResponse = {
  success?: boolean;
  error?: string;
};

export default function InternalAccessForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/internal-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const raw = await res.json().catch(() => null);
      const data = (raw ?? {}) as LoginResponse;

      if (!res.ok) {
        throw new Error(data.error ?? "Login failed");
      }

      window.location.assign("/admin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      console.error("Internal login error:", err);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="internal-email"
          className="block text-sm font-medium text-white/80"
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
          placeholder="hello@mixdencreative.com"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/30 focus:bg-white/10"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="internal-password"
          className="block text-sm font-medium text-white/80"
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
          placeholder="Enter your password"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/30 focus:bg-white/10"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-black transition hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-xs text-white/45">
        New internal users should open their invite email first to claim
        access and set their password.
      </p>
    </form>
  );
}
