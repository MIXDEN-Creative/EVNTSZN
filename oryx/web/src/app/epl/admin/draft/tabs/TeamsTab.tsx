"use client";

import { useEffect, useMemo, useState } from "react";

type TeamsResponse = {
  teams?: any[];
  needs?: any[];
  board?: any[];
};

type NotesResponse = {
  notes?: any[];
};

export default function TeamsTab({ seasonSlug }: any) {
  const [teams, setTeams] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [board, setBoard] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const [teamsRes, notesRes] = await Promise.all([
      fetch(`/api/epl/draft/teams?seasonSlug=${seasonSlug}`, { cache: "no-store" }),
      fetch(`/api/epl/draft/notes?seasonSlug=${seasonSlug}&type=team`, { cache: "no-store" }),
    ]);

    const teamsJson = (await teamsRes.json()) as TeamsResponse;
    const notesJson = (await notesRes.json()) as NotesResponse;

    setTeams(teamsJson?.teams || []);
    setNeeds(teamsJson?.needs || []);
    setBoard(teamsJson?.board || []);
    setNotes(notesJson?.notes || []);
  }

  async function addNote() {
    if (!selectedTeam || !note) return;
    await fetch("/api/epl/draft/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "team",
        seasonSlug,
        teamId: selectedTeam,
        note,
      }),
    });
    setNote("");
    await load();
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  const picksByTeam = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const pick of board) {
      if (!map[pick.team_id]) map[pick.team_id] = [];
      map[pick.team_id].push(pick);
    }
    return map;
  }, [board]);

  const needsByTeam = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const need of needs) {
      if (!map[need.team_id]) map[need.team_id] = [];
      map[need.team_id].push(need);
    }
    return map;
  }, [needs]);

  const notesByTeam = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const n of notes) {
      if (!map[n.team_id]) map[n.team_id] = [];
      map[n.team_id].push(n);
    }
    return map;
  }, [notes]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Team War Room</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Team needs and notes</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr_180px]">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add war room note"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <button onClick={addNote} className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold">
            Add Note
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.length ? (
          teams.map((team) => (
            <div key={team.team_id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                {team.team_logo_url ? (
                  <img src={team.team_logo_url} alt={team.team_name} className="h-12 w-12 object-contain" />
                ) : null}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">Team</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{team.team_name}</h3>
                </div>
              </div>

              <div className="mt-4 text-sm text-white/55">Current roster count: {team.roster_count}</div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Team Needs</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(needsByTeam[team.team_id] || []).length ? (
                    needsByTeam[team.team_id].map((need: any) => (
                      <span key={need.need_id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/75">
                        {need.need_rank}. {need.position_code}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/45">No draft needs set.</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Draft Picks</p>
                <div className="mt-2 space-y-2">
                  {(picksByTeam[team.team_id] || []).slice(0, 8).map((pick: any) => (
                    <div key={pick.draft_pick_id} className="text-sm text-white/75">
                      #{pick.overall_pick_number} • {pick.player_name || "Open slot"} • {pick.preferred_position || "—"}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">War Room Notes</p>
                <div className="mt-2 space-y-2">
                  {(notesByTeam[team.team_id] || []).slice(0, 4).map((n: any) => (
                    <div key={n.note_id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">
                      {n.note}
                    </div>
                  ))}
                  {!(notesByTeam[team.team_id] || []).length ? (
                    <div className="text-sm text-white/45">No notes yet.</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-white/60">
            Team draft views will populate after a draft is created.
          </div>
        )}
      </div>
    </div>
  );
}
