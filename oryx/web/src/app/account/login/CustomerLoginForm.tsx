"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirectOrigin, normalizeNextPath } from "@/lib/domains";

type CustomerLoginFormProps = {
  next: string;
};

export default function CustomerLoginForm({ next }: CustomerLoginFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const nextPath = normalizeNextPath(next);
    const redirectOrigin = getLoginRedirectOrigin(nextPath, window.location.host);
    const redirectTo = `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
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
      setMessage("Check your email for your sign-in link.");
    }

    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-black p-6 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6"
      >
        <h1 className="text-4xl font-black">Sign In</h1>
        <p className="mt-2 text-white/65">
          Use your email to sign in and access your account.
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm text-white/70">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-[#A259FF] px-5 py-4 font-bold disabled:opacity-50"
        >
          {loading ? "Sending..." : "Email Me a Login Link"}
        </button>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
            {message}
          </div>
        ) : null}
      </form>
    </main>
  );
}
