"use client";

import { useEffect, useState } from "react";
import { formatBytes } from "@/lib/storage";

type CapacityMetric = {
  label: string;
  current: number;
  limit: number;
  unit: string;
  status: "safe" | "warning" | "critical";
  upgradeGuidance: string;
};

export default function PlatformCapacityMonitor() {
  const [metrics, setMetrics] = useState<CapacityMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCapacity() {
      try {
        const res = await fetch("/api/admin/capacity", { cache: "no-store" });
        const data = (await res.json()) as { metrics?: CapacityMetric[]; error?: string };
        setMetrics(data.metrics || []);
      } catch (err) {
        console.error("Failed to load platform capacity stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadCapacity();
  }, []);

  if (loading) return <div className="animate-pulse rounded-[32px] border border-white/10 bg-black/40 p-8 h-64" />;

  return (
    <section className="ev-panel p-8 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <div className="ev-section-kicker">Founder Dashboard</div>
          <h2 className="mt-3 text-3xl font-black text-white tracking-tight">Platform Capacity Monitor</h2>
          <p className="mt-3 text-sm text-white/50 max-w-2xl">
            Live measurements of our free-stack infrastructure usage and growth pressure. 
            Upgrade guidance appears automatically when we approach tier limits.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[32px] border p-7 transition-all ${
            metric.status === "critical" ? "border-red-500/30 bg-red-500/10" :
            metric.status === "warning" ? "border-amber-500/30 bg-amber-500/10" :
            "border-white/10 bg-white/[0.02]"
          }`}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A259FF]">{metric.label}</div>
              <div className={`h-2 w-2 rounded-full ${
                metric.status === "critical" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                metric.status === "warning" ? "bg-amber-500" :
                "bg-emerald-500"
              }`} />
            </div>
            
            <div className="mt-6 flex items-baseline gap-2">
              <div className="text-4xl font-black text-white">
                {metric.unit === "bytes" ? formatBytes(metric.current, 0) : metric.current.toLocaleString()}
              </div>
              <div className="text-sm font-bold text-white/40">
                / {metric.unit === "bytes" ? formatBytes(metric.limit, 0) : metric.limit.toLocaleString()}
              </div>
            </div>

            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div 
                className={`h-full transition-all duration-500 ${
                  metric.status === "critical" ? "bg-red-500" :
                  metric.status === "warning" ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}
                style={{ width: `${Math.min((metric.current / metric.limit) * 100, 100)}%` }}
              />
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-white/30">Upgrade Guidance</div>
              <p className="text-sm leading-relaxed text-white/70 italic">
                {metric.upgradeGuidance}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
