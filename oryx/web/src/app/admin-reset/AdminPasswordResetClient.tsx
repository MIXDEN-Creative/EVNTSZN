"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdminOrigin } from "@/lib/domains";

export default function AdminPasswordResetClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setReady(Boolean(data.user));
    });
  }, []);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (password.length < 10) {
      setMessage("Use a password with at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSaved(true);
    setMessage("Password updated. Return to internal sign-in with your new password.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">Reset password</div>
              <h1 className="ev-title">Set a new password for your internal access.</h1>
              <p className="ev-subtitle">
                Complete recovery here, then return to the admin workspace with your updated credential.
              </p>
            </div>
          </div>
        </div>

        <section className="ev-panel mt-6 p-6">
          <div className="ev-section-kicker">New password</div>
          {!ready ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/72">
              This recovery link is missing an active reset session. Request a fresh reset email from internal access.
            </div>
          ) : (
            <form onSubmit={updatePassword} className="grid gap-4">
              <input
                type="password"
                className="ev-field"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <input
                type="password"
                className="ev-field"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button type="submit" disabled={loading} className="ev-button-primary disabled:opacity-50">
                {loading ? "Saving password..." : "Save new password"}
              </button>
              {saved ? (
                <a href={`${getAdminOrigin(window.location.host)}/admin-login`} className="ev-button-secondary text-center">
                  Back to internal sign-in
                </a>
              ) : null}
            </form>
          )}

          {message ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
              {message}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
