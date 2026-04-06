"use client";

import { useState } from "react";
import { getCanonicalUrl } from "@/lib/domains";

export default function LiveControlTab({
  state,
  jumpPick,
  setJumpPick,
  control,
  toggleAuto,
  jumpToPick,
  seasonSlug,
}: any) {
  const [message, setMessage] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [revealDurationMs, setRevealDurationMs] = useState(7000);

  async function setProductionState(nextState: string) {
    if (!state.session?.draft_session_id) return;

    await fetch("/api/epl/draft/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.session.draft_session_id,
        state: nextState,
        message,
        sponsorMessage,
        revealDurationMs,
      }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => control("prev")} className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white">
            Previous Pick
          </button>
          <button onClick={() => control("next")} className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold">
            Next Pick
          </button>
          <button
            onClick={() => toggleAuto(!state.session?.auto_mode)}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white"
          >
            {state.session?.auto_mode ? "Pause Auto" : "Start Auto"}
          </button>
          <a
            href={getCanonicalUrl(`/epl/draft/${seasonSlug}`, "epl", window.location.host)}
            target="_blank"
            className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white"
          >
            Open Draft Screen
          </a>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[200px_180px_1fr]">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Jump To Pick
            </label>
            <input
              value={jumpPick}
              onChange={(e) => setJumpPick(e.target.value)}
              type="number"
              min="0"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
              placeholder="Pick #"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={jumpToPick}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white"
            >
              Jump To Pick
            </button>
          </div>
          <div className="flex items-end text-sm text-white/45">
            Hotkeys: while not typing, → next pick, ← previous pick, space = auto start / pause
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Production Controls</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Presentation modes</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Public message / holding text"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={sponsorMessage}
            onChange={(e) => setSponsorMessage(e.target.value)}
            placeholder="Sponsor message"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={String(revealDurationMs)}
            onChange={(e) => setRevealDurationMs(Number(e.target.value || 7000))}
            placeholder="Reveal duration ms"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => setProductionState("ready")} className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white">Ready</button>
          <button onClick={() => setProductionState("holding")} className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white">Holding Screen</button>
          <button onClick={() => setProductionState("intermission")} className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white">Intermission</button>
          <button onClick={() => setProductionState("sponsor")} className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white">Sponsor Mode</button>
          <button onClick={() => setProductionState("live")} className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold">Go Live</button>
          <button onClick={() => setProductionState("complete")} className="h-12 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 text-green-200">Draft Complete</button>
        </div>
      </div>
    </div>
  );
}
