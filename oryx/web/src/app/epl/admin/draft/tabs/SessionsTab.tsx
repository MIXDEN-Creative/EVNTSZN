"use client";

import { useEffect, useState } from "react";
import { getCanonicalUrl } from "@/lib/domains";

type LogsResponse = {
  logs?: any[];
};

type TradesResponse = {
  trades?: any[];
};

export default function SessionsTab({ sessions, reopenSession, seasonSlug }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradeId, setTradeId] = useState("");
  const [tradeNote, setTradeNote] = useState("");

  async function load() {
    const [logsRes, tradesRes] = await Promise.all([
      fetch(`/api/epl/draft/action-log?seasonSlug=${seasonSlug}`, { cache: "no-store" }),
      fetch(`/api/epl/draft/trades?seasonSlug=${seasonSlug}`, { cache: "no-store" }),
    ]);

    const logsJson = (await logsRes.json()) as LogsResponse;
    const tradesJson = (await tradesRes.json()) as TradesResponse;

    setLogs(logsJson?.logs || []);
    setTrades(tradesJson?.trades || []);
  }

  async function resolveTrade(resolution: "approved" | "rejected") {
    if (!tradeId) return;
    await fetch("/api/epl/draft/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", tradeId, resolution, note: tradeNote }),
    });
    setTradeId("");
    setTradeNote("");
    await load();
  }

  useEffect(() => {
    load();
  }, [seasonSlug]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Draft History / Sessions</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">All draft sessions by season</h3>
        </div>

        {sessions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.04]">
                <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                  <th className="px-4 py-4">Season</th>
                  <th className="px-4 py-4">Title</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Progress</th>
                  <th className="px-4 py-4">Auto</th>
                  <th className="px-4 py-4">Created</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black/30">
                {sessions.map((session: any) => {
                  const pct = session.total_picks
                    ? Math.round((session.current_pick_number / session.total_picks) * 100)
                    : 0;

                  return (
                    <tr key={session.draft_session_id} className="align-top">
                      <td className="px-4 py-4 text-sm text-white/85">
                        <div className="font-medium text-white">{session.season_name}</div>
                        <div className="mt-1 text-white/45">{session.season_slug}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/85">{session.title}</td>
                      <td className="px-4 py-4 text-sm text-white/75">{session.status}</td>
                      <td className="px-4 py-4 text-sm text-white/75">
                        {session.current_pick_number} / {session.total_picks} ({pct}%)
                      </td>
                      <td className="px-4 py-4 text-sm text-white/75">
                        {session.auto_mode ? `${session.auto_interval_seconds}s` : "Off"}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/55">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => reopenSession(session)}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                          >
                            Open In Console
                          </button>
                          <a
                            href={getCanonicalUrl(`/epl/draft/${session.season_slug}`, "epl", window.location.host)}
                            target="_blank"
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white"
                          >
                            Open Screen
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
            No draft sessions yet.
          </div>
        )}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Trades</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Commissioner trade resolution</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_2fr_180px_180px]">
          <input
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
            placeholder="Trade ID"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <input
            value={tradeNote}
            onChange={(e) => setTradeNote(e.target.value)}
            placeholder="Trade resolution note"
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          />
          <button onClick={() => resolveTrade("approved")} className="h-12 rounded-2xl bg-[#A259FF] px-5 text-white font-semibold">
            Approve Trade
          </button>
          <button onClick={() => resolveTrade("rejected")} className="h-12 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 text-red-200">
            Reject Trade
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/[0.04]">
              <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                <th className="px-4 py-4">Trade</th>
                <th className="px-4 py-4">Teams</th>
                <th className="px-4 py-4">Picks</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-black/30">
              {trades.map((trade) => (
                <tr key={trade.trade_id}>
                  <td className="px-4 py-4 text-sm text-white/45">{trade.trade_id}</td>
                  <td className="px-4 py-4 text-sm text-white">{trade.from_team_name} ↔ {trade.to_team_name}</td>
                  <td className="px-4 py-4 text-sm text-white/75">
                    #{trade.from_pick_overall ?? "—"} ↔ #{trade.to_pick_overall ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-white/75">{trade.trade_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Action Log</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Recent draft actions</h3>
        </div>

        {logs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.04]">
                <tr className="text-xs uppercase tracking-[0.2em] text-white/50">
                  <th className="px-4 py-4">When</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Action</th>
                  <th className="px-4 py-4">Team</th>
                  <th className="px-4 py-4">Player</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black/30">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 text-sm text-white/55">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-white/75">{log.action_type}</td>
                    <td className="px-4 py-4 text-sm text-white">{log.action_label}</td>
                    <td className="px-4 py-4 text-sm text-white/75">{log.related_team_name || "—"}</td>
                    <td className="px-4 py-4 text-sm text-white/75">{log.related_player_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-white/60">
            No logged draft actions yet.
          </div>
        )}
      </div>
    </div>
  );
}
