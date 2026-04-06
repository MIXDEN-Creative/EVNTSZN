"use client";

import { useState } from "react";
import { getAdminOrigin, getLoginUrl } from "@/lib/domains";

export default function AdminInviteAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = searchParams?.token || "";
  const loginHref =
    typeof window === "undefined"
      ? `/account/login?next=${encodeURIComponent(`/admin-invite/accept?token=${token}`)}`
      : getLoginUrl(`/admin-invite/accept?token=${token}`, window.location.host);

  async function acceptInvite() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/invites/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setMessage(data.error || "Failed to accept invite");
    } else {
      setMessage("Invite accepted. You can now use the admin dashboard.");
      window.location.href = getAdminOrigin(window.location.host);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-3xl font-black">Accept Admin Invite</h1>
        <p className="mt-2 text-white/65">
          You need to be signed in with the invited email first.
        </p>

        <div className="mt-5 grid gap-3">
          <a
            href={loginHref}
            className="rounded-2xl border border-white/15 px-5 py-4 text-center hover:bg-white/10"
          >
            Sign in with invited email
          </a>

          <button
            onClick={acceptInvite}
            disabled={!token || loading}
            className="rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
          >
            {loading ? "Accepting..." : "Accept Invite"}
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}
