"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdminOrigin } from "@/lib/domains";

export default function AdminInviteAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const token = searchParams?.token || "";
  const email = searchParams?.email || "";

  async function acceptInvite() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const res = await fetch("/api/admin/invites/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, email, fullName, password }),
    });

    const data = (await res.json()) as { error?: string; mode?: string };

    if (!res.ok) {
      setMessage(data.error || "Failed to accept invite");
    } else {
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage("Access was activated. Sign in from the internal login page with your new password.");
        } else {
          window.location.href = getAdminOrigin(window.location.host);
        }
      } else {
        setMessage("Invite accepted. Sign in from internal access with your password.");
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-kicker">Internal invite</div>
        <h1 className="mt-3 text-3xl font-black">Activate your EVNTSZN internal access</h1>
        <p className="mt-2 text-white/65">
          Claim your invited access, set a password, and enter the internal tools that match your assigned role.
        </p>

        {email ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/72">Invited email: {email}</div> : null}

        <div className="mt-5 grid gap-3">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="ev-field"
            placeholder="Full name"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="ev-field"
            type="password"
            placeholder="Create password"
          />
          <div className="text-xs leading-6 text-white/52">Use at least 10 characters. This password is only for internal staff access, not attendee/member login.</div>

          <button
            onClick={acceptInvite}
            disabled={!token || !email || !password || loading}
            className="rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
          >
            {loading ? "Activating access..." : "Activate access"}
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
            {message}
          </div>
        ) : null}

        <div className="mt-4 text-xs leading-6 text-white/52">
          Expired invite or wrong email? Ask HQ/Admin to resend the invite instead of opening a public sign-up flow.
        </div>
      </div>
    </main>
  );
}
