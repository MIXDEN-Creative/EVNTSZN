"use client";

import { useEffect, useState } from "react";

type PulseSummary = {
  score: number | null;
  label: string;
  summary: string;
  views: number;
  taps: number;
  reactions: number;
  uniqueInteractions: number;
  nearbyEventCount: number;
  isLive: boolean;
  error?: string;
};

function getSessionKey(slug: string) {
  const key = `evntszn-node-session:${slug}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `${slug}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

export default function NodePulsePanel({
  slug,
  city,
  initialSummary,
}: {
  slug: string;
  city?: string | null;
  initialSummary: PulseSummary;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetch(`/api/evntszn/nodes/${slug}/pulse`, { cache: "no-store" })
        .then((response) => response.json())
        .then((json) => {
          const payload = json as PulseSummary;
          if (!payload.error) {
            setSummary(payload);
          }
        })
        .catch(() => undefined);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [slug]);

  async function react(reaction: string) {
    setMessage(null);
    const sessionKey = getSessionKey(slug);
    const res = await fetch(`/api/evntszn/nodes/${slug}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interactionType: "reaction",
        reaction,
        sessionKey,
        source: "node_pulse",
        city,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not record reaction.");
      return;
    }

    const pulseRes = await fetch(`/api/evntszn/nodes/${slug}/pulse`, { cache: "no-store" });
    const pulseJson = (await pulseRes.json()) as PulseSummary;
    if (pulseRes.ok) {
      setSummary(pulseJson);
      setMessage("Reaction recorded.");
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(162,89,255,0.08),rgba(255,255,255,0.03)),rgba(7,7,10,0.82)] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#A259FF]">Node pulse</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            {summary.score ? `🔥 ${summary.score.toFixed(1)} – ${summary.label}` : "Live room read"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">{summary.summary}</p>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-black/20 px-5 py-4 text-right">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Live right now</div>
          <div className="mt-2 text-2xl font-black text-white">{summary.taps} taps</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
            {summary.nearbyEventCount ? `${summary.nearbyEventCount} active event signals` : `${summary.uniqueInteractions} unique interactions`}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { key: "quiet", label: "Quiet" },
          { key: "moving", label: "Moving" },
          { key: "lit", label: "Lit" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => void react(item.key)}
            className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:-translate-y-[1px] hover:bg-white/[0.07] active:scale-[0.99]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Quick reaction</div>
            <div className="mt-2 text-lg font-black text-white">{item.label}</div>
          </button>
        ))}
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">{message}</div>
      ) : null}
    </section>
  );
}
