"use client";

import Link from 'next/link'; // Import Link for potential internal links

export default function DraftCountdown() {
  const baltimoreDraftDate = "June 20";
  const coastalDraftDate = "June 27";
  const trainingCampStart = "June 29";
  const seasonKickoff = "July 11";

  return (
    <section
      id="countdown"
      className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:p-8"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
        EPL Season 1 Schedule
      </div>

      <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
        The Path to the Prime Bowl Begins: Draft Nights & Season Kickoff
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
        EPL Season 1 features a dual-draft structure to accommodate our key markets, followed by an intensive training camp and a thrilling season culminating in the Prime Bowl.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Baltimore Draft Night
          </div>
          <div className="mt-3 text-2xl font-black text-white md:text-3xl">{baltimoreDraftDate}</div>
          <div className="mt-3 text-sm leading-6 text-white/68">
            The inaugural draft event for Baltimore-market players.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Coastal Draft Night
          </div>
          <div className="mt-3 text-2xl font-black text-white md:text-3xl">{coastalDraftDate}</div>
          <div className="mt-3 text-sm leading-6 text-white/68">
            Serving Rehoboth Beach, Bethany Beach, Dewey, and Ocean City areas.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Player Pool
          </div>
          <div className="mt-3 text-2xl font-black text-white md:text-3xl">144 Players</div>
          <div className="mt-3 text-sm leading-6 text-white/68">
            Total intake across both draft nights for Season 1.
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
         <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Training Camp
          </div>
          <div className="mt-3 text-2xl font-black text-white md:text-3xl">{trainingCampStart} - July 10</div>
          <div className="mt-3 text-sm leading-6 text-white/68">
            Intensive preparation for all selected players.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Season Kickoff
          </div>
          <div className="mt-3 text-2xl font-black text-white md:text-3xl">{seasonKickoff}</div>
          <div className="mt-3 text-sm leading-6 text-white/68">
            The regular season begins, featuring Baltimore vs Coastal matchups.
          </div>
        </div>
      </div>
    </section>
  );
}
