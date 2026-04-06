"use client";

import { useEffect, useMemo, useState } from "react";

type BoardResponse = {
  board?: any[];
};

export default function OutputsTab({ seasonSlug }: any) {
  const [board, setBoard] = useState<any[]>([]);
  const [packet, setPacket] = useState<any>(null);

  async function load() {
    const [boardRes, packetRes] = await Promise.all([
      fetch(`/api/epl/draft/board?seasonSlug=${seasonSlug}`, { cache: "no-store" }),
      fetch(`/api/epl/draft/packet?seasonSlug=${seasonSlug}`, { cache: "no-store" }),
    ]);

    const boardJson = (await boardRes.json()) as BoardResponse;
    const packetJson = (await packetRes.json()) as Record<string, unknown> | null;

    setBoard(boardJson?.board || []);
    setPacket(packetJson || null);
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  const grouped = useMemo(() => {
    const teams: Record<string, any[]> = {};
    for (const pick of board) {
      if (!teams[pick.team_name]) teams[pick.team_name] = [];
      teams[pick.team_name].push(pick);
    }
    return teams;
  }, [board]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Outputs</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Draft results and exports</h3>

        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`/api/epl/draft/export?seasonSlug=${seasonSlug}&kind=board`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white">Export Board CSV</a>
          <a href={`/api/epl/draft/export?seasonSlug=${seasonSlug}&kind=pool`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white">Export Player Pool CSV</a>
          <a href={`/api/epl/draft/export?seasonSlug=${seasonSlug}&kind=log`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white">Export Action Log CSV</a>
          <a href={`/api/epl/draft/packet?seasonSlug=${seasonSlug}`} className="rounded-2xl bg-[#A259FF] px-4 py-3 text-sm font-semibold text-white">Download Full Packet JSON</a>
        </div>

        {packet ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/75">Board Rows: {packet.board?.length || 0}</div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/75">Player Pool Rows: {packet.playerPool?.length || 0}</div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/75">Action Logs: {packet.actionLog?.length || 0}</div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/75">Trades: {packet.trades?.length || 0}</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(grouped).map(([team, picks]) => (
          <div key={team} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-xl font-semibold text-white">{team}</h4>
            <p className="mt-2 text-sm text-white/55">{(picks as any[]).length} drafted players</p>
            <div className="mt-4 space-y-2">
              {(picks as any[]).map((pick) => (
                <div key={pick.draft_pick_id} className="text-sm text-white/75">
                  #{pick.overall_pick_number} • {pick.player_name} • {pick.preferred_position || "—"}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
