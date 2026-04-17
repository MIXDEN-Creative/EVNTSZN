"use client";

import { useEffect, useMemo, useState } from "react";

type PlayerPoolResponse = {
  players?: any[];
};

type PlayerNotesResponse = {
  notes?: any[];
};

export default function PlayerPoolTab({ seasonSlug }: any) {
  const [players, setPlayers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [scoutTitle, setScoutTitle] = useState("");
  const [scoutNote, setScoutNote] = useState("");
  const [scoutScore, setScoutScore] = useState("");

  async function load() {
    const params = new URLSearchParams({ seasonSlug });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (position) params.set("position", position);

    const [poolRes, noteRes] = await Promise.all([
      fetch(`/api/epl/draft/player-pool?${params.toString()}`, { cache: "no-store" }),
      fetch(`/api/epl/draft/notes?seasonSlug=${seasonSlug}&kind=player`, { cache: "no-store" }),
    ]);

    const poolJson = (await poolRes.json()) as PlayerPoolResponse;
    const noteJson = (await noteRes.json()) as PlayerNotesResponse;

    setPlayers(poolJson?.players || []);
    setNotes(noteJson?.notes || []);
  }

  async function setEligibility(playerProfileId: string, isEligible: boolean) {
    await fetch("/api/epl/draft/override", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "setEligibility",
        seasonSlug,
        playerProfileId,
        isEligible,
        reason:
          reason ||
          (isEligible
            ? "Commissioner approved for draft pool"
            : "Commissioner removed from draft pool"),
      }),
    });

    await load();
  }

  async function addScoutingNote() {
    if (!selectedPlayerId || !scoutTitle || !scoutNote) return;

    await fetch("/api/epl/draft/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "player",
        seasonSlug,
        playerProfileId: selectedPlayerId,
        title: scoutTitle,
        note: scoutNote,
        score: scoutScore ? Number(scoutScore) : null,
      }),
    });

    setScoutTitle("");
    setScoutNote("");
    setScoutScore("");
    await load();
  }

  useEffect(() => {
    load();
  }, [seasonSlug, q, status, position]);

  const notesByPlayer = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const n of notes) {
      if (!map[n.player_profile_id]) map[n.player_profile_id] = [];
      map[n.player_profile_id].push(n);
    }
    return map;
  }, [notes]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Player Pool</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Draftable players</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search player, email, jersey name"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          >
            <option value="">All statuses</option>
            <option value="draftable">Approved/Paid Draftable</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Filter by position"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Commissioner note / reason"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <div className="flex items-center text-sm text-white/55">
            {players.length} players returned
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Scouting Notes</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Player scouting input</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            placeholder="Player Profile ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={scoutTitle}
            onChange={(e) => setScoutTitle(e.target.value)}
            placeholder="Scouting title"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={scoutNote}
            onChange={(e) => setScoutNote(e.target.value)}
            placeholder="Scouting note"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <div className="flex gap-3">
            <input
              value={scoutScore}
              onChange={(e) => setScoutScore(e.target.value)}
              placeholder="Score"
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            />
            <button
              onClick={addScoutingNote}
              className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/[0.04]">
              <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                <th className="px-4 py-4">Player</th>
                <th className="px-4 py-4">Football Info</th>
                <th className="px-4 py-4">Registration</th>
                <th className="px-4 py-4">Draft</th>
                <th className="px-4 py-4">Scouting</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-black/30">
              {players.map((player) => (
                <tr key={player.season_registration_id}>
                  <td className="px-4 py-4 text-sm text-white/85">
                    <div className="font-medium text-white">{player.player_name}</div>
                    <div className="mt-1 text-white/45">{player.email}</div>
                    <div className="mt-1 text-white/45">{player.phone || "No phone"}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    <div>{player.preferred_position || "—"}</div>
                    <div className="mt-1 text-white/45">
                      {player.secondary_position || "No secondary"}
                    </div>
                    <div className="mt-2 text-white/60">
                      {player.jersey_name || "No jersey name"} • #
                      {player.preferred_jersey_number_1 ?? "—"} / #
                      {player.preferred_jersey_number_2 ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    <div>Registration: {player.registration_status}</div>
                    <div className="mt-1 text-white/45">
                      Application: {player.application_status || "—"}
                    </div>
                    <div className="mt-1 text-white/45">
                      Fee:{" "}
                      {player.waived_fee
                        ? "Waived"
                        : `$${Number(player.payment_amount_usd || 0).toFixed(2)}`}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    <div>{player.draft_eligible ? "Eligible" : "Not marked"}</div>
                    <div className="mt-1 text-white/45">
                      {player.draft_eligibility_reason || "No reason"}
                    </div>
                    <div className="mt-1 text-white/45">
                      {player.assigned_to_team ? "Assigned to team" : "Unassigned"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    {(notesByPlayer[player.player_profile_id] || []).length ? (
                      <div className="space-y-2">
                        {notesByPlayer[player.player_profile_id].slice(0, 2).map((n: any) => (
                          <div
                            key={n.id}
                            className="rounded-xl border border-white/10 bg-black/30 p-2"
                          >
                            <div className="font-medium text-white">{n.title}</div>
                            <div>{n.note}</div>
                            <div className="mt-1 text-white/45">
                              {n.score ?? "No score"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/45">No scouting notes</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setEligibility(player.player_profile_id, true)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                      >
                        Mark Eligible
                      </button>
                      <button
                        onClick={() => setEligibility(player.player_profile_id, false)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
