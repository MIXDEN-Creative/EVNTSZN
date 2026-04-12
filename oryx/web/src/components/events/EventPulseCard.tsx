"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { describePulseScore } from "@/lib/platform-products";

type PulseSummary = {
  count: number;
  score: number | null;
  label: string;
  summary: string;
  breakdown: {
    energy: number;
    crowd: number;
    music: number;
    bar: number;
  } | null;
  error?: string;
};

const DEFAULT_VOTE = {
  energyLevel: 8,
  crowdDensity: 8,
  musicVibe: 8,
  barActivity: 7,
};

export default function EventPulseCard({ eventId }: { eventId: string }) {
  const [summary, setSummary] = useState<PulseSummary | null>(null);
  const [vote, setVote] = useState(DEFAULT_VOTE);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scoreDirection, setScoreDirection] = useState<"up" | "down" | null>(null);
  const [voteFlash, setVoteFlash] = useState(false);
  const previousScoreRef = useRef<number | null>(null);

  const loadPulse = useEffectEvent(async () => {
    setLoading(true);
    const res = await fetch(`/api/evntszn/events/${eventId}/pulse`, { cache: "no-store" });
    const json = (await res.json()) as PulseSummary;
    if (res.ok) {
      const previousScore = previousScoreRef.current;
      const nextScore = Number(json.score || 0);
      if (previousScore !== null && nextScore && previousScore !== nextScore) {
        setScoreDirection(nextScore > previousScore ? "up" : "down");
        window.setTimeout(() => setScoreDirection(null), 900);
      }
      previousScoreRef.current = nextScore || null;
      setSummary(json);
    } else {
      setMessage(json.error || "Could not load pulse.");
    }
    setLoading(false);
  });

  useEffect(() => {
    void loadPulse();
    const intervalId = window.setInterval(() => {
      void loadPulse();
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, [eventId]);

  async function submitVote() {
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`/api/evntszn/events/${eventId}/pulse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vote),
    });
    const json = (await res.json()) as PulseSummary;
    if (!res.ok) {
      setMessage(json.error || "Could not submit pulse update.");
    } else {
      setSummary(json);
      setMessage("Pulse update recorded.");
      setVoteFlash(true);
      window.setTimeout(() => setVoteFlash(false), 700);
    }
    setSubmitting(false);
  }

  const tone = describePulseScore(summary?.score).tone;
  const toneClass =
    tone === "peak"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : tone === "active"
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
        : tone === "warming"
          ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
          : "border-white/10 bg-white/[0.03] text-white/70";

  return (
    <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(162,89,255,0.08),rgba(255,255,255,0.03)),rgba(7,7,10,0.82)] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#A259FF]">EVNTSZN Pulse</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">How&apos;s the vibe right now?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
            Quick taps only. Rate the room so people can tell whether the event is warming up, active, packed, or peaking.
          </p>
        </div>
        <div className={`min-w-[12rem] rounded-[28px] border px-5 py-5 text-left md:text-right ${toneClass}`}>
          <div className="text-[11px] uppercase tracking-[0.22em]">Live score</div>
          <div className={`mt-2 text-4xl font-black transition-all duration-500 md:text-5xl ${scoreDirection === "up" ? "scale-[1.05] text-emerald-100" : scoreDirection === "down" ? "scale-[0.98] text-amber-100" : ""}`}>
            {summary?.score ? `🔥 ${summary.score.toFixed(1)} – ${summary.label}` : "No score"}
          </div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
            {scoreDirection === "up" ? "Rising now" : scoreDirection === "down" ? "Cooling slightly" : "Live room read"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Energy", "energyLevel"],
          ["Crowd", "crowdDensity"],
          ["Music", "musicVibe"],
          ["Bar", "barActivity"],
        ].map(([label, key]) => (
          <label key={key} className={`rounded-[24px] border border-white/10 bg-black/20 p-4 transition-transform duration-200 ${voteFlash ? "scale-[1.01]" : ""}`}>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</div>
            <input
              type="range"
              min={1}
              max={10}
              value={vote[key as keyof typeof vote]}
              onChange={(event) =>
                setVote((current) => ({
                  ...current,
                  [key]: Number(event.target.value),
                }))
              }
              className="mt-4 w-full accent-[#A259FF]"
            />
            <div className="mt-2 text-xl font-bold text-white">{vote[key as keyof typeof vote]}</div>
          </label>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submitVote}
          disabled={submitting}
          className={`ev-button-primary disabled:opacity-50 ${voteFlash ? "scale-[1.03]" : ""}`}
        >
          {submitting ? "Submitting..." : "Submit pulse"}
        </button>
        <div className="text-sm text-white/55">
          {loading
            ? "Loading live pulse..."
            : summary?.count
              ? `${summary.count} recent room updates${summary.summary ? ` • ${summary.summary}` : ""}`
              : "No pulse yet. First update sets the room."}
        </div>
      </div>

      {summary?.breakdown ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Energy", summary.breakdown.energy],
            ["Crowd density", summary.breakdown.crowd],
            ["Music vibe", summary.breakdown.music],
            ["Bar activity", summary.breakdown.bar],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</div>
              <div className="mt-2 text-2xl font-bold text-white">{Number(value).toFixed(1)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">{message}</div>
      ) : null}
    </section>
  );
}
