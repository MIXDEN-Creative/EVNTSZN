"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EngagementSnapshot } from "@/lib/engagement";

function formatProgress(snapshot: EngagementSnapshot) {
  if (!snapshot.xpForNextLevel) return 0;
  return Math.max(0, Math.min(100, Math.round((snapshot.xpIntoLevel / snapshot.xpForNextLevel) * 100)));
}

function getStatusTier(level: number) {
  if (level >= 7) return "Operator";
  if (level >= 5) return "Insider";
  if (level >= 3) return "Connector";
  return "Explorer";
}

type EngagementLoopPanelProps = {
  contextLabel: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: "compact" | "full";
};

export default function EngagementLoopPanel({
  contextLabel,
  title,
  body,
  actionHref = "/enter",
  actionLabel = "Enter EVNTSZN",
  variant = "compact",
}: EngagementLoopPanelProps) {
  const [snapshot, setSnapshot] = useState<EngagementSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/engagement/snapshot", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as EngagementSnapshot & { error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || "Could not load progression.");
        setSnapshot(payload);
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not load progression.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const progressPercent = useMemo(() => (snapshot ? formatProgress(snapshot) : 0), [snapshot]);
  const missions = snapshot?.missions.slice(0, variant === "full" ? 6 : 3) || [];
  const badges = snapshot?.badges.slice(0, variant === "full" ? 6 : 3) || [];
  const nearComplete = snapshot?.nearComplete.slice(0, variant === "full" ? 4 : 2) || [];
  const runs = snapshot?.runs.slice(0, variant === "full" ? 3 : 1) || [];
  const collections = snapshot?.collections.slice(0, variant === "full" ? 3 : 2) || [];
  const momentum = snapshot?.liveMomentum.slice(0, variant === "full" ? 4 : 2) || [];
  const socialMomentum = snapshot?.socialMomentum.slice(0, variant === "full" ? 4 : 2) || [];
  const missedOpportunities = snapshot?.missedOpportunities.slice(0, variant === "full" ? 3 : 1) || [];
  const expiringRewards = snapshot?.expiringRewards.slice(0, variant === "full" ? 4 : 2) || [];
  const nextBestAction = snapshot?.nextBestAction || nearComplete[0] || null;
  const signedIn = Boolean(snapshot?.signedIn);
  const statusTier = getStatusTier(snapshot?.level || 1);
  const unfinishedLabel = snapshot?.nearComplete.length
    ? `${snapshot.nearComplete.length} thing${snapshot.nearComplete.length === 1 ? "" : "s"} still close to finishing`
    : snapshot?.signedIn
      ? "Momentum is still active"
      : "Build your first night";
  const returnHook = snapshot?.signedIn
    ? snapshot.nearComplete.length
      ? "Here's what you left unfinished"
      : "Pick up where you left off"
    : "Start your first signal today";

  return (
    <section className={`overflow-hidden rounded-[36px] border border-white/10 ${variant === "full" ? "bg-[linear-gradient(135deg,rgba(162,89,255,0.22),rgba(0,0,0,0.94))] p-6 md:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)]" : "bg-white/[0.03] p-6"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{contextLabel}</div>
          <h2 className={`${variant === "full" ? "mt-3 text-4xl md:text-5xl" : "mt-3 text-2xl"} font-black tracking-[0.02em] text-white`}>{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">{body}</p>
        </div>
        <Link href={signedIn ? "/account" : actionHref} className={`ev-button-secondary ${variant === "full" ? "px-6 py-3 text-xs tracking-[0.22em]" : ""}`}>
          {signedIn ? "Open member hub" : actionLabel}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
          {statusTier}
        </span>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
          snapshot?.streakAtRisk
            ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
        }`}>
          {snapshot?.streakAtRisk ? "Your streak is at risk" : returnHook}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
          {unfinishedLabel}
        </span>
        <span className="rounded-full border border-[#a259ff]/25 bg-[#a259ff]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">
          {snapshot?.socialComparisonLabel || "You’re gaining momentum"}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
          {snapshot?.peopleLikeYouLabel || "People like you are exploring this tonight"}
        </span>
      </div>

      {message ? (
        <div className="mt-5 rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/68">
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-[#a259ff]/30 bg-[linear-gradient(135deg,rgba(162,89,255,0.22),rgba(15,15,20,0.95))] px-5 py-5 shadow-[0_24px_72px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-y-0 right-0 w-[240px] bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.35),transparent_65%)]" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f0e5ff]/80">Your next move</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-white md:text-[2rem]">
              {nextBestAction?.label || snapshot?.bestNextMove || "Open discovery"}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{nextBestAction ? `${nextBestAction.actionsRemaining} left` : "Fastest win"}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{nextBestAction ? `${nextBestAction.progressPercent}% complete` : "Visible above the fold"}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">Priority action</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffffff,#a259ff)] transition-all" style={{ width: `${nextBestAction?.progressPercent || progressPercent}%` }} />
            </div>
            <div className="mt-3 text-sm leading-6 text-white/72">
              {nextBestAction
                ? nextBestAction.detail
                : snapshot?.bestNextMove || "Make one low-friction move and the system will start storing progress."}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/28 px-4 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]">Today’s Signal</div>
          <div className="mt-2 text-xl font-black text-white">{snapshot?.todaySignal.title || "Today’s Signal"}</div>
          <div className="mt-2 text-sm leading-6 text-white/70">{snapshot?.todaySignal.body || "Open EVNTSZN and keep momentum alive."}</div>
          <div className="mt-4 rounded-[18px] border border-[#a259ff]/20 bg-[#a259ff]/12 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]/80">Daily bonus</div>
            <div className="mt-1 text-2xl font-black text-white">+{snapshot?.todaySignal.bonusXp || 0} XP</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]/78">{snapshot?.todaySignal.resetLabel || "Resets in 24 hours"}</div>
          </div>
          <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
            {snapshot?.signedIn
              ? snapshot.nearComplete.length
                ? `Pick up where you left off: ${snapshot.nearComplete[0]?.title || "your next close win"}.`
                : "Momentum is still active. Keep the loop moving and the next unlock stays in view."
              : "Start your first signal today and the system will begin storing progress."}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/30 px-4 py-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">{snapshot?.timePressureLabel || "Time pressure"}</div>
          <div className="mt-2 text-xl font-black text-white">{snapshot?.timePressureCountdown || "Expiring soon"}</div>
          <div className="mt-3 text-sm leading-6 text-white/62">
            {snapshot?.streakRiskLabel || "Near-complete missions and streaks stay visible until the window closes."}
          </div>
          <div className="mt-4 rounded-[18px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/90">Pressure</div>
            <div className="mt-1 text-sm font-bold text-white">Finish before the window closes.</div>
          </div>
        </div>
      </div>

      <div className={`mt-6 grid gap-4 ${variant === "full" ? "xl:grid-cols-[1.05fr_0.95fr]" : "lg:grid-cols-[1.05fr_0.95fr]"}`}>
        <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                {signedIn ? "Member progression" : "Progression preview"}
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                Level {snapshot?.level || 1}
              </div>
              <div className="mt-2 text-sm text-white/62">
                {signedIn
                  ? `${snapshot?.totalXp || 0} XP total · ${snapshot?.nearCompleteHeadline || snapshot?.bestNextMove || "Open discovery to begin."}`
                  : "Save plans, follow city movement, post Pulse, and build a repeatable weekend run."}
              </div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Streak</div>
              <div className="mt-1 text-2xl font-black text-white">{snapshot?.currentStreak || 0}</div>
              <div className="text-xs text-white/55">Longest {snapshot?.longestStreak || 0}</div>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ffffff,#a259ff)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
            <span>{snapshot?.xpIntoLevel || 0}/{snapshot?.xpForNextLevel || 100} XP to next level</span>
            <span>City score {snapshot?.cityParticipationScore || 0}</span>
            <span>Trust {snapshot?.trustScore || 0}</span>
          </div>

          {snapshot?.streakAtRisk ? (
            <div className="mt-4 rounded-[18px] border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
              <div className="font-bold">{snapshot.streakRiskLabel}</div>
              <div className="mt-1 text-amber-50/80">Check EVNTSZN tonight so you do not lose momentum.</div>
            </div>
          ) : null}

          {snapshot?.recentReward ? (
            <div className="mt-4 rounded-[18px] border border-[#a259ff]/35 bg-[#a259ff]/12 px-4 py-3 text-sm text-[#f0e5ff] motion-safe:animate-pulse">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]/78">Unexpected bonus</div>
              <div className="mt-1 font-bold">{snapshot.recentReward.title}</div>
              <div className="mt-1">{snapshot.recentReward.detail}</div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em]">+{snapshot.recentReward.bonusXp} XP</div>
            </div>
          ) : null}

          {expiringRewards.length ? (
            <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">Expiring rewards</div>
              <div className="mt-3 grid gap-2">
                {expiringRewards.map((item) => (
                  <div key={`${item.kind}:${item.title}`} className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{item.title}</div>
                        <div className="mt-0.5 text-xs text-white/58">{item.detail}</div>
                      </div>
                      <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">{item.timeLeftLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Saved plans", value: String(snapshot?.savedCount || 0), tone: "from-white/5 to-white/[0.03]" },
              { label: "Collections", value: String(snapshot?.cityCollectionCount || snapshot?.collections.filter((item) => item.completed).length || 0), tone: "from-[#a259ff]/18 to-[#a259ff]/8" },
              { label: "Perks + status", value: String(snapshot?.sponsorPerkActionsCount || 0), tone: "from-white/5 to-white/[0.03]" },
            ].map((item) => (
              <div key={item.label} className={`rounded-[22px] border border-white/10 bg-gradient-to-br ${item.tone} px-4 py-4`}>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{item.label}</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Almost there</div>
              <div className="rounded-full border border-[#a259ff]/20 bg-[#a259ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">Priority wins</div>
            </div>
            <div className="mt-4 grid gap-3">
              {nearComplete.length ? nearComplete.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-[#a259ff]/25 bg-[#a259ff]/12 px-4 py-4 shadow-[0_18px_40px_rgba(162,89,255,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f0e5ff]/84">{item.label}</div>
                      <div className="mt-1 text-lg font-black tracking-tight text-white">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/68">{item.detail}</div>
                      {item.timeLeftLabel || item.windowLabel ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.windowLabel ? <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{item.windowLabel}</span> : null}
                          {item.timeLeftLabel ? <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">{item.timeLeftLabel}</span> : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">{item.progressPercent}%</div>
                      <div className="mt-1 text-lg font-black text-white">+{item.xpReward + item.bonusXp} XP</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{item.actionsRemaining} left</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                  Make a few moves and the system will start surfacing your easiest wins here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Runs</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">{snapshot?.nextRun ? "Next run ready" : "Chain your next run"}</div>
            </div>
            <div className="mt-4 grid gap-3">
              {runs.length ? runs.map((run) => (
                <div key={run.runKey} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{run.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/62">{run.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{run.progressPercent}%</div>
                      <div className="mt-1 text-xs text-white/58">{run.progressCount}/{run.targetSteps}</div>
                      {run.urgencyLabel ? <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">{run.urgencyLabel}</div> : null}
                      {run.timeLeftLabel ? <div className="mt-1 text-[10px] text-white/48">{run.timeLeftLabel}</div> : null}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                  Your next run appears here as soon as you start moving.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Best next moves</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Easy wins first</div>
            </div>
            <div className="mt-4 grid gap-3">
              {missions.length ? missions.map((mission) => (
                <div key={mission.missionKey} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{mission.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/62">{mission.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{mission.progressCount}/{mission.targetCount}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">{mission.frequency}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                  Sign in to turn this lane into tracked missions, badges, and city progress.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Collections</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Future value</div>
            </div>
            <div className="mt-4 grid gap-3">
              {collections.length ? collections.map((collection) => (
                <div key={collection.collectionKey} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{collection.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/62">{collection.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{collection.progressPercent}%</div>
                      <div className="mt-1 text-xs text-white/58">{collection.progressCount}/{collection.targetCount}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                  Collections unlock as you build a richer city graph through saving, opening, and moving on plans.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Identity</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Status</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {snapshot?.socialIdentity?.length ? snapshot.socialIdentity.map((tag) => (
                <div key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                  {tag}
                </div>
              )) : (
                <div className="text-sm text-white/60">
                  Your identity labels start forming through planning, city exploration, Pulse participation, and repeated return behavior.
                </div>
              )}
            </div>
            <div className="mt-4 rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/65">
              Saved plans, collections, and perks turn into visible status here. Keep building the loop and your account becomes the proof of future value.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Live city momentum</div>
            <div className="mt-4 grid gap-3">
              {momentum.map((item) => (
                <div key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/58">{item.body}</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Social momentum</div>
            <div className="mt-4 grid gap-3">
              {socialMomentum.map((item) => (
                <div key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{item.label}</div>
                  <div className="mt-2 text-sm font-bold text-white">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-white/58">{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          {missedOpportunities.length ? (
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Missed opportunities</div>
              <div className="mt-4 grid gap-3">
                {missedOpportunities.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">{item.urgencyLabel}</div>
                    <div className="mt-2 text-sm font-bold text-white">{item.title}</div>
                    <div className="mt-1 text-xs leading-5 text-white/58">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Recent unlocks</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.length ? badges.map((badge) => (
                <div key={`${badge.badgeKey}-${badge.awardedAt || "seed"}`} className="rounded-full border border-[#a259ff]/30 bg-[#a259ff]/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">
                  {badge.badgeLabel}
                </div>
              )) : (
                <div className="text-sm text-white/60">
                  Your first unlocks come from profile completion, city exploration, Pulse contribution, reserve movement, and EPL or crew participation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
