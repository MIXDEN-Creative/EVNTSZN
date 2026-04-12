"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAppOrigin } from "@/lib/domains";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageTone("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageTone("error");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessageTone("success");
      setMessage("Password successfully updated. You can now sign in.");
    }

    setLoading(false);
  }

  return (
    <div className="ev-panel">
      <form onSubmit={handleUpdate}>
        <div className="ev-section-kicker">Security Update</div>
        <h2 className="ev-panel-title mt-3">Set your new password</h2>
        <p className="ev-panel-copy">
          Choose a strong password for your EVNTSZN account.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-white/70">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ev-field"
            placeholder="Minimum 6 characters"
            required
            minLength={6}
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-white/70">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="ev-field"
            placeholder="Confirm your password"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="ev-button-primary mt-8 w-full disabled:opacity-50"
        >
          {loading ? "Updating password..." : "Update password"}
        </button>

        {message ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${
            messageTone === "success" 
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" 
              : "border-red-500/20 bg-red-500/5 text-red-200"
          }`}>
            {message}
            {messageTone === "success" && (
              <div className="mt-4">
                <Link
                  href={`${getAppOrigin()}/account/login`}
                  className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:opacity-90"
                >
                  Go to sign in
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </form>
    </div>
  );
}
