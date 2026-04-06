"use client";

import { useEffect, useMemo, useState } from "react";

export default function DraftBoardTab({ seasonSlug }: any) {
  const [board, setBoard] = useState<any[]>([]);
  const [pickA, setPickA] = useState("");
  const [pickB, setPickB] = useState("");
  const [manualPickId, setManualPickId] = useState("");
  const [manualPlayerId, setManualPlayerId] = useState("");
  const [note, setNote] = useState("");
  const [fromTeamId, setFromTeamId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [fromPickId, setFromPickId] = useState("");
  const [toPickId, setToPickId] = useState("");

  async function load() {
    const res = await fetch(`/api/epl/draft/board?seasonSlug=${seasonSlug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setBoard(json?.board || []);
  }

  async function swapPicks() {
    if (!pickA || !pickB) return;
    await fetch("/api/epl/draft/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "swapPicks",
        pickA,
        pickB,
        note,
      }),
    });
    await load();
  }

  async function manualAssign() {
    if (!manualPickId || !manualPlayerId) return;
    await fetch("/api/epl/draft/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "manualAssign",
        draftPickId: manualPickId,
        playerProfileId: manualPlayerId,
        note,
      }),
    });
    await load();
  }


  async function createTrade() {
    if (!fromTeamId || !toTeamId) return;
    const stateRes = await fetch(`/api/epl/draft/state?seasonSlug=${seasonSlug}`, { cache: "no-store" });
    const stateJson = await stateRes.json();

    await fetch("/api/epl/draft/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        seasonSlug,
        draftSessionId: stateJson?.session?.draft_session_id,
        fromTeamId,
        toTeamId,
        fromPickId: fromPickId || null,
        toPickId: toPickId || null,
        notes: note || null,
      }),
    });
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  const grouped = useMemo(() => {
    const rounds: Record<number, any[]> = {};
    for (const pick of board) {
      if (!rounds[pick.round_number]) rounds[pick.round_number] = [];
      rounds[pick.round_number].push(pick);
    }
    return rounds;
  }, [board]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Draft Board</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Full 72-slot board</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={pickA}
            onChange={(e) => setPickA(e.target.value)}
            placeholder="Pick A ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={pickB}
            onChange={(e) => setPickB(e.target.value)}
            placeholder="Pick B ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <button
            onClick={swapPicks}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white"
          >
            Swap Picks
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <input
            value={manualPickId}
            onChange={(e) => setManualPickId(e.target.value)}
            placeholder="Draft Pick ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={manualPlayerId}
            onChange={(e) => setManualPlayerId(e.target.value)}
            placeholder="Player Profile ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Override note"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <button
            onClick={manualAssign}
            className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold"
          >
            Manual Assign
          </button>
        </div>
      </div>


      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Trade Desk</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Create trade proposal</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <input value={fromTeamId} onChange={(e) => setFromTeamId(e.target.value)} placeholder="From Team ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
          <input value={toTeamId} onChange={(e) => setToTeamId(e.target.value)} placeholder="To Team ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
          <input value={fromPickId} onChange={(e) => setFromPickId(e.target.value)} placeholder="From Pick ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
          <input value={toPickId} onChange={(e) => setToPickId(e.target.value)} placeholder="To Pick ID" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
          <button onClick={createTrade} className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold">
            Propose Trade
          </button>
        </div>
      </div>

      {Object.keys(grouped).length ? (
        Object.entries(grouped).map(([round, picks]) => (
          <div key={round} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <h4 className="text-xl font-semibold text-white">Round {round}</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(picks as any[]).map((pick) => (
                <div key={pick.draft_pick_id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#A259FF]">
                    Overall {pick.overall_pick_number} • Pick {pick.pick_number_in_round}
                  </div>
                  <div className="mt-2 text-[11px] text-white/35 break-all">{pick.draft_pick_id}</div>
                  <div className="mt-3 text-xl font-semibold text-white">{pick.team_name}</div>
                  <div className="mt-2 text-white/80">{pick.player_name || "Open slot"}</div>
                  <div className="mt-1 text-white/50">
                    {pick.preferred_position || "—"} • {pick.jersey_name || "No jersey"}
                  </div>
                  <div className="mt-2 text-[11px] text-white/35 break-all">
                    Player ID: {pick.player_profile_id || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 text-white/60">
          No board yet for this season.
        </div>
      )}
    </div>
  );
}
