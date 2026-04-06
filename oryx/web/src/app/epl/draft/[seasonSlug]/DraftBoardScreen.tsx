"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type DraftState = {
  session: any | null;
  picks: any[];
  currentPick: any | null;
  nextPick: any | null;
  revealedPicks: any[];
  error?: string;
};

type DraftStateResponse = DraftState;

function getPhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/epl-player-photos/${path}`;
}

function FullscreenMessage({
  label,
  message,
}: {
  label: string;
  message?: string | null;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="text-sm uppercase tracking-[0.45em] text-[#A259FF]">{label}</div>
        <div className="mt-6 text-6xl font-semibold tracking-tight">{message || label}</div>
      </div>
    </div>
  );
}

function PickIsInOverlay({
  teamName,
  teamLogo,
}: {
  teamName?: string | null;
  teamLogo?: string | null;
}) {
  return (
    <motion.div
      key="pick-is-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.04, opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        {teamLogo ? (
          <motion.img
            src={teamLogo}
            alt={teamName || "Team"}
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-8 h-36 w-36 object-contain"
          />
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="text-sm uppercase tracking-[0.45em] text-[#A259FF]"
        >
          EPL Draft
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.45 }}
          className="mt-6 text-7xl font-semibold tracking-tight text-white"
        >
          THE PICK IS IN
        </motion.div>

        {teamName ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="mt-5 text-xl uppercase tracking-[0.22em] text-white/55"
          >
            {teamName}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

export default function DraftBoardScreen({ seasonSlug }: { seasonSlug: string }) {
  const [state, setState] = useState<DraftState>({
    session: null,
    picks: [],
    currentPick: null,
    nextPick: null,
    revealedPicks: [],
  });
  const [showPickIsIn, setShowPickIsIn] = useState(false);
  const [displayedPick, setDisplayedPick] = useState<any | null>(null);
  const previousPickRef = useRef<number>(0);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function loadState() {
    const res = await fetch(`/api/epl/draft/state?seasonSlug=${seasonSlug}`, {
      cache: "no-store",
    });
    const json = (await res.json()) as DraftStateResponse;

    const incomingPick = json?.session?.current_pick_number || 0;
    const incomingCurrentPick = json?.currentPick || null;
    const revealDuration = json?.session?.reveal_duration_ms || 7000;

    if (incomingPick > 0 && incomingPick !== previousPickRef.current) {
      setShowPickIsIn(true);

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }

      revealTimeoutRef.current = setTimeout(() => {
        setDisplayedPick(incomingCurrentPick);
        setShowPickIsIn(false);
      }, revealDuration);

      previousPickRef.current = incomingPick;
    } else if (!displayedPick && incomingCurrentPick) {
      setDisplayedPick(incomingCurrentPick);
    }

    setState(json);
  }

  useEffect(() => {
    loadState();
    const poll = setInterval(loadState, 1000);
    return () => {
      clearInterval(poll);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [seasonSlug]);

  const livePick = displayedPick || state.currentPick;
  const currentPhoto = getPhotoUrl(livePick?.headshot_storage_path);
  const recent = state.revealedPicks.slice(-10).reverse();

  if (state.session?.production_state === "holding") {
    return <FullscreenMessage label="Holding" message={state.session?.production_message} />;
  }

  if (state.session?.production_state === "intermission") {
    return <FullscreenMessage label="Intermission" message={state.session?.production_message} />;
  }

  if (state.session?.production_state === "sponsor") {
    return <FullscreenMessage label="Sponsor" message={state.session?.sponsor_message || state.session?.production_message} />;
  }

  if (state.session?.production_state === "complete") {
    return <FullscreenMessage label="Draft Complete" message={state.session?.production_message || "Season Draft Complete"} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatePresence>
        {showPickIsIn ? (
          <PickIsInOverlay
            teamName={state.currentPick?.team_name}
            teamLogo={state.currentPick?.team_logo_url}
          />
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_22%)]" />

      <div className="grid min-h-screen grid-cols-[1.5fr_0.5fr]">
        <div className="relative flex flex-col justify-between border-r border-white/10 p-10">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.34em] text-[#A259FF]">
              {state.session?.title || "EPL Draft"}
            </motion.p>

            <div className="mt-10 rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-10 shadow-[0_0_60px_rgba(162,89,255,0.08)]">
              <AnimatePresence mode="wait">
                {livePick ? (
                  <motion.div
                    key={livePick.draft_pick_id}
                    initial={{ opacity: 0, y: 28, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.01 }}
                    transition={{ duration: 0.55 }}
                    className="grid grid-cols-[340px_1fr] items-center gap-10"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08, duration: 0.5 }}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-black/50 aspect-[4/5]"
                    >
                      {currentPhoto ? (
                        <img src={currentPhoto} alt={livePick.player_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg text-white/35">No Photo</div>
                      )}
                    </motion.div>

                    <div>
                      <div className="text-sm uppercase tracking-[0.24em] text-white/45">
                        Round {livePick.round_number} • Pick {livePick.pick_number_in_round} • Overall {livePick.overall_pick_number}
                      </div>

                      {livePick.team_logo_url ? (
                        <img src={livePick.team_logo_url} alt={livePick.team_name} className="mb-6 mt-8 h-24 w-24 object-contain" />
                      ) : null}

                      <div className="text-6xl font-semibold tracking-tight">{livePick.team_name}</div>
                      <div className="mt-6 text-5xl text-white/95">{livePick.player_name}</div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <span className="rounded-full border border-[#A259FF]/40 bg-[#A259FF]/10 px-4 py-2 text-sm uppercase tracking-[0.18em] text-[#D3B2FF]">
                          {livePick.preferred_position || "ATH"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm uppercase tracking-[0.18em] text-white/70">
                          {livePick.jersey_name || "Player"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-14">
                    <div className="text-sm uppercase tracking-[0.22em] text-white/45">Draft Board Ready</div>
                    <div className="mt-8 text-6xl font-semibold tracking-tight">Awaiting First Pick</div>
                    <div className="mt-6 text-2xl text-white/55">The commissioner can reveal picks from the draft console.</div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Current Pick</p>
              <p className="mt-2 text-3xl font-semibold">{state.session?.current_pick_number || 0}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Total Picks</p>
              <p className="mt-2 text-3xl font-semibold">{state.session?.total_picks || 0}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Status</p>
              <p className="mt-2 text-3xl font-semibold">{state.session?.status || "Ready"}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">Next Up</p>
            {state.nextPick ? (
              <div className="mt-4">
                <div className="text-sm text-white/45">
                  Round {state.nextPick.round_number} • Pick {state.nextPick.pick_number_in_round}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {state.nextPick.team_logo_url ? (
                    <img src={state.nextPick.team_logo_url} alt={state.nextPick.team_name} className="h-12 w-12 object-contain" />
                  ) : null}
                  <div className="text-2xl font-semibold">{state.nextPick.team_name}</div>
                </div>
                <div className="mt-2 text-lg text-white/75">{state.nextPick.player_name}</div>
              </div>
            ) : (
              <div className="mt-4 text-white/55">No upcoming pick.</div>
            )}
          </div>

          <div className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">Recent Picks</p>
            <div className="mt-4 space-y-3">
              {recent.length ? (
                recent.map((pick) => (
                  <div key={pick.draft_pick_id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">#{pick.overall_pick_number}</div>
                    <div className="mt-2 flex items-center gap-3">
                      {pick.team_logo_url ? (
                        <img src={pick.team_logo_url} alt={pick.team_name} className="h-10 w-10 object-contain" />
                      ) : null}
                      <div>
                        <div className="text-lg font-semibold text-white">{pick.team_name}</div>
                        <div className="mt-1 text-white/72">{pick.player_name}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/55">No revealed picks yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
