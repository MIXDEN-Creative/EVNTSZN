"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAppOrigin, getLoginRedirectOrigin } from "@/lib/domains";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient();
    const redirectOrigin = getLoginRedirectOrigin("/account/reset-password", window.location.host);
    const redirectTo = `${redirectOrigin}/account/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessageTone("success");
      setMessage("Password reset link sent. Please check your email.");
    }

    setLoading(false);
  }

  return (
    <div className="ev-panel">
      <form onSubmit={handleReset}>
        <div className="ev-section-kicker">Account Recovery</div>
        <h2 className="ev-panel-title mt-3">Reset your password</h2>
        <p className="ev-panel-copy">
          Enter your email address and we will send you a link to reset your password.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-white/70">Email Address</label>
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
          className="ev-button-primary mt-8 w-full disabled:opacity-50"
        >
          {loading ? "Sending link..." : "Send reset link"}
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
          <Link
            href={`${getAppOrigin()}/account/login`}
            className="text-sm font-semibold text-white/50 hover:text-white transition"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
