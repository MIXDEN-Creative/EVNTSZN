"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAppOrigin, getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

type CustomerLoginFormProps = {
  next: string;
};

export default function CustomerLoginForm({ next }: CustomerLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient();
    const nextPath = normalizeNextPath(next);
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    let timeoutHandle: number | null = null;

    try {
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = window.setTimeout(() => {
          reject(new Error("Sign-in timed out. Check your connection and try again."));
        }, timeoutMs);
      });
      const authResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        timeoutPromise,
      ]);
      if (authResult.error) {
        setMessage(authResult.error.message);
        return;
      }

      const session = authResult.data.session;
      if (!session?.access_token || !session.refresh_token) {
        setMessage("Sign-in completed without a usable session. Please try again.");
        return;
      }

      const syncResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        }),
      });
      const syncPayload = (await syncResponse.json().catch(() => ({}))) as { error?: string };
      if (!syncResponse.ok) {
        setMessage(syncPayload.error || "Your account signed in, but the session could not be saved.");
        await supabase.auth.signOut().catch(() => undefined);
        return;
      }

      window.location.assign(`${redirectOrigin}${nextPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in did not complete. Please try again.");
    } finally {
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }
      setLoading(false);
    }
  }

  return (
    <div className="ev-panel">
      <form onSubmit={handleLogin}>
        <div className="ev-section-kicker">Member Entry</div>
        <h2 className="ev-panel-title mt-3">Sign in to your account</h2>
        <p className="ev-panel-copy">
          Access your tickets, saved events, and order history with your email and password.
        </p>

        <div className="mt-7">
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

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white/70">Password</label>
            <Link 
              href={`${getAppOrigin()}/account/forgot-password`}
              className="text-xs font-semibold text-[#caa7ff] hover:text-white transition"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ev-field"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ev-button-primary mt-8 w-full disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in to account"}
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

      <div className="mt-8 border-t border-white/10 pt-7">
        <div className="text-center">
          <p className="text-sm text-white/50">Don't have an attendee account yet?</p>
          <Link
            href={`${getAppOrigin()}/account/register?next=${encodeURIComponent(next)}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Create member account
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Destination after sign-in: <span className="text-white/50">{next}</span>
        </div>
      </div>
    </div>
  );
}
