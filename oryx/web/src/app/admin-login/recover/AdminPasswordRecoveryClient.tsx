"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAppOrigin } from "@/lib/domains";

export default function AdminPasswordRecoveryClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"neutral" | "success" | "error">("neutral");

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setTone("neutral");

    const accessCheck = await fetch("/api/admin/internal-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const accessJson = (await accessCheck.json().catch(() => ({}))) as { error?: string; mode?: string };

    if (!accessCheck.ok) {
      setTone("error");
      setMessage(accessJson.error || "Internal password recovery is not available for that email.");
      setLoading(false);
      return;
    }

    if (accessJson.mode === "founder") {
      setTone("neutral");
      setMessage("Founder override is managed separately. Rotate the HQ credential through runtime secrets or use the founder login path.");
      setLoading(false);
      return;
    }

    if (accessJson.mode === "invite") {
      setTone("neutral");
      setMessage("Your invite is still pending. Open the latest invite email to activate access, or ask HQ/Admin to resend the invite.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppOrigin(window.location.host)}/auth/callback?next=${encodeURIComponent("/admin-reset")}`,
    });

    if (error) {
      setTone("error");
      setMessage(error.message);
    } else {
      setTone("success");
      setMessage("Recovery email sent. Open the link, set a new password, then return to internal access.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">Internal recovery</div>
              <h1 className="ev-title">Reset your internal password without reopening public access.</h1>
              <p className="ev-subtitle">
                This flow only works for active internal users. Pending invite users should use their invite email instead of a generic recovery loop.
              </p>
            </div>
          </div>
        </div>

        <section className="ev-panel mt-6 p-6">
          <div className="ev-section-kicker">Password recovery</div>
          <h2 className="mt-3 text-2xl font-black text-white">Send a reset link to your invited internal email</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Use the same email tied to your HQ, admin, office, ops, scanner, or curator access.
          </p>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/62">
            Pending invite users should reopen their invite email. Active internal users get a password reset link without reopening magic-link entry for internal tools.
          </div>

          <form onSubmit={requestReset} className="mt-5 grid gap-4">
            <input
              type="email"
              className="ev-field"
              placeholder="you@evntszn.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="ev-button-primary disabled:opacity-50">
                {loading ? "Sending reset link..." : "Send reset link"}
              </button>
              <Link href="/admin-login" className="ev-button-secondary">
                Back to internal sign-in
              </Link>
              <Link href="/support" className="ev-button-secondary">
                Need admin help?
              </Link>
            </div>
          </form>

          {message ? (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                tone === "error"
                  ? "border-red-400/20 bg-red-500/10 text-red-100"
                  : tone === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-black/30 text-white/75"
              }`}
            >
              {message}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
