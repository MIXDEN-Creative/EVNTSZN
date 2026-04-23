"use client";

import { useEffect, useMemo, useState } from "react";
import type { EngagementSnapshot } from "@/lib/engagement";

function clamp(min: number, max: number, value: number) {
  return Math.max(min, Math.min(max, value));
}

function seededValue(seed: number, base: number, spread: number) {
  return base + (Math.abs(seed) % spread);
}

function getStatusTier(level: number) {
  if (level >= 7) return "Operator";
  if (level >= 5) return "Insider";
  if (level >= 3) return "Connector";
  return "Explorer";
}

function buildSignalCounts(snapshot: EngagementSnapshot | null, cityLabel: string) {
  const signalSeed =
    (snapshot?.savedCount || 0) * 11 +
    (snapshot?.reserveActionsCount || 0) * 13 +
    (snapshot?.pulsePostsCount || 0) * 17 +
    (snapshot?.crewRequestsCount || 0) * 7 +
    (snapshot?.eplActionsCount || 0) * 5 +
    (snapshot?.sponsorPerkActionsCount || 0) * 3 +
    (snapshot?.stayopsActionsCount || 0) * 2 +
    cityLabel.length * 4;

  return {
    exploring: clamp(8, 49, seededValue(signalSeed, 8, 24) + Math.round((snapshot?.cityParticipationScore || 0) / 6)),
    plansToday: clamp(6, 44, seededValue(signalSeed, 9, 19) + Math.round((snapshot?.savedCount || 0) / 2)),
    activatedToday: clamp(3, 24, seededValue(signalSeed, 3, 12) + Math.round((snapshot?.cityCollectionCount || 0) / 2)),
    momentum: snapshot?.socialMomentum?.[0]?.title || "Momentum rising",
    trending: snapshot?.liveMomentum?.[0]?.title || "Trending tonight",
    recent: snapshot?.nextBestAction?.title || snapshot?.todaySignal?.title || "Recently activated",
    trust: snapshot?.aheadOfUsersPercent != null
      ? `Ahead of ${snapshot.aheadOfUsersPercent}% of users this week`
      : "Trusted by venues in your city",
  };
}

export default function SystemActivityRail({
  cityLabel = "your city",
  audienceLabel = "people",
  mode = "default",
}: {
  cityLabel?: string;
  audienceLabel?: string;
  mode?: "default" | "compact";
}) {
  const [snapshot, setSnapshot] = useState<EngagementSnapshot | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/engagement/snapshot", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active || !response.ok) return;
        setSnapshot(payload as EngagementSnapshot);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const signals = useMemo(() => buildSignalCounts(snapshot, cityLabel), [snapshot, cityLabel]);
  const compact = mode === "compact";
  const scopeLabel = cityLabel === "your city" ? "EVNTSZN cities" : cityLabel;
  const statusTier = getStatusTier(snapshot?.level || 1);
  const activeSignals = snapshot
    ? clamp(
        0,
        4,
        Math.round(
          ((snapshot.savedCount || 0) +
            (snapshot.reserveActionsCount || 0) +
            (snapshot.pulsePostsCount || 0) +
            (snapshot.crewRequestsCount || 0) +
            (snapshot.eplActionsCount || 0)) / 3,
        ) + (snapshot.nearComplete.length > 0 ? 1 : 0),
      )
    : 0;
  const unfinishedCount = snapshot?.nearComplete.length || snapshot?.missedOpportunities.length || 0;
  const riskLabel = snapshot?.streakAtRisk
    ? snapshot.streakRiskLabel || "Your streak is at risk"
    : snapshot?.currentStreak
      ? "Your streak is stable for now"
      : null;
  const nextUnlockLabel = snapshot?.nextBestAction?.title || snapshot?.todaySignal?.title || "Build your first night";
  const returnHook = snapshot?.signedIn
    ? unfinishedCount > 0
      ? "Here's what you left unfinished"
      : "Momentum is still active"
    : "Start your first signal today";
  const primaryHeadline = snapshot?.signedIn
    ? activeSignals > 0
      ? `You have ${activeSignals} active signals tonight`
      : unfinishedCount > 0
        ? "1 plan is still incomplete"
        : "Momentum is still active"
    : "Start your first signal today";

  return (
    <section className={`mx-auto max-w-7xl px-4 ${compact ? "py-6 md:px-6 lg:px-8" : "py-10 md:px-6 lg:px-8"}`}>
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(162,89,255,0.16),rgba(0,0,0,0.9))] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8c1ff]">Live system</div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{primaryHeadline}</h3>
            <p className="mt-1 text-sm leading-6 text-white/62">{returnHook}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              For {audienceLabel}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
              {statusTier}
            </div>
            <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
              snapshot?.streakAtRisk
                ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
            }`}>
              {snapshot?.streakAtRisk ? "Your streak is at risk" : riskLabel || "Recently activated"}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="rounded-full border border-[#a259ff]/25 bg-[#a259ff]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">
            {snapshot?.socialComparisonLabel || "You're gaining momentum"}
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
            {snapshot?.peopleLikeYouLabel || "People like you are exploring this tonight"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Plans created today", value: signals.plansToday, detail: snapshot?.signedIn ? `${unfinishedCount || 1} plan${unfinishedCount === 1 ? "" : "s"} still in motion.` : "Build your first night and start storing progress." },
            { label: "Momentum rising", value: signals.momentum, detail: snapshot?.signedIn ? `${activeSignals || 1} signal${(activeSignals || 1) === 1 ? "" : "s"} are active across your loop.` : "The city layer keeps moving even when volume is light." },
            { label: "Trending tonight", value: signals.trending, detail: snapshot?.signedIn ? `You're ${snapshot.nextBestAction?.progressPercent || 0}% toward ${nextUnlockLabel}.` : `Search and browse behavior is clustering around ${cityLabel}.` },
            { label: "Powering nights across", value: `EVNTSZN ${cityLabel}`, detail: snapshot?.signedIn ? (snapshot.streakAtRisk ? "This unlock expires tonight." : "You're ahead of where most users start.") : signals.trust },
          ].map((item) => (
            <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/25 px-4 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">{item.label}</div>
              <div className="mt-2 text-xl font-black text-white">{typeof item.value === "number" ? item.value : item.value}</div>
              <div className="mt-2 text-xs leading-5 text-white/60">{item.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            snapshot?.signedIn ? `You’re ${snapshot.level} level and building from here.` : "Trusted by venues in your city",
            snapshot?.signedIn
              ? `You’re 1 step from unlocking ${nextUnlockLabel}.`
              : "Used by organizers running 50+ events",
            snapshot?.signedIn
              ? snapshot.streakAtRisk
                ? "This unlock expires tonight"
                : "Momentum is still active"
              : `Powering nights across ${scopeLabel}`,
          ].map((item) => (
            <div key={item} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/78">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
