"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/money";

type MetricRow = {
  key: string;
  label: string;
  weight: number;
  value: number;
  score: number;
  available: boolean;
};

type Snapshot = {
  score: number;
  trend: number;
  benchmarkScore: number;
  lastUpdatedAt: string;
  breakdown: {
    metrics: MetricRow[];
  };
};

export default function PerformanceScorePanel({
  scope,
  title,
  refresh = false,
}: {
  scope: "host" | "organizer" | "venue" | "reserve" | "founder";
  title: string;
  refresh?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/performance/summary?scope=${scope}${refresh ? "&refresh=1" : ""}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string; snapshot?: Snapshot };
        if (!response.ok || !payload.snapshot) {
          throw new Error(payload.error || "Could not load performance score.");
        }
        setSnapshot(payload.snapshot);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load performance score."));
  }, [refresh, scope]);

  if (message) {
    return <div className="rounded-[28px] border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">{message}</div>;
  }

  if (!snapshot) {
    return <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03] p-6 h-[220px]" />;
  }

  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{title}</div>
          <div className="mt-3 text-5xl font-black tracking-tight text-white">{snapshot.score.toFixed(1)}</div>
          <div className="mt-2 text-sm text-white/58">
            Trend {snapshot.trend >= 0 ? "+" : ""}{snapshot.trend.toFixed(1)} vs prior run
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Benchmark</div>
          <div className="mt-1 text-xl font-bold text-white">{snapshot.benchmarkScore.toFixed(1)}</div>
          <div className="mt-1 text-xs text-white/45">Updated {new Date(snapshot.lastUpdatedAt).toLocaleString("en-US")}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {snapshot.breakdown.metrics.map((metric) => (
          <div key={metric.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-white">{metric.label}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">{metric.weight}%</div>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{metric.available ? metric.score.toFixed(1) : "—"}</div>
            <div className="mt-1 text-sm text-white/55">
              {metric.available ? `Input ${metric.key.includes("revenue") ? formatUsd(metric.value) : metric.value.toFixed(1)}` : "Waiting for live data"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
