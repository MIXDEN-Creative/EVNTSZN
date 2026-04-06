export default function OverviewTab({ state }: any) {
  const progress = state?.session?.total_picks
    ? Math.round((state.session.current_pick_number / state.session.total_picks) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Current Pick</p>
        <p className="mt-3 text-3xl font-semibold text-white">
          {state.session?.current_pick_number || 0}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Total Picks</p>
        <p className="mt-3 text-3xl font-semibold text-white">
          {state.session?.total_picks || 72}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Status</p>
        <p className="mt-3 text-3xl font-semibold text-white">
          {state.session?.status || "No Draft"}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Progress</p>
        <p className="mt-3 text-3xl font-semibold text-white">{progress}%</p>
      </div>

      <div className="md:col-span-2 rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">On Screen Now</p>
        {state.currentPick ? (
          <div className="mt-4">
            <div className="text-sm text-[#A259FF]">
              Round {state.currentPick.round_number} • Pick {state.currentPick.pick_number_in_round} • Overall {state.currentPick.overall_pick_number}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{state.currentPick.team_name}</div>
            <div className="mt-2 text-xl text-white/80">{state.currentPick.player_name}</div>
            <div className="mt-1 text-white/50">
              {state.currentPick.preferred_position || "ATH"} • {state.currentPick.jersey_name || "No jersey name"}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-white/55">No pick revealed yet.</div>
        )}
      </div>

      <div className="md:col-span-2 rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Next Up</p>
        {state.nextPick ? (
          <div className="mt-4">
            <div className="text-sm text-[#A259FF]">
              Round {state.nextPick.round_number} • Pick {state.nextPick.pick_number_in_round} • Overall {state.nextPick.overall_pick_number}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{state.nextPick.team_name}</div>
            <div className="mt-2 text-xl text-white/80">{state.nextPick.player_name}</div>
            <div className="mt-1 text-white/50">
              {state.nextPick.preferred_position || "ATH"} • {state.nextPick.jersey_name || "No jersey name"}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-white/55">No upcoming pick.</div>
        )}
      </div>
    </div>
  );
}
