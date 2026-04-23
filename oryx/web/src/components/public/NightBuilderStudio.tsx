"use client";

import { useEffect, useMemo, useState } from "react";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";

const LOCAL_STORAGE_KEY = "evntszn:night-plans:v1";

const DEFAULT_LANES = [
  "Rooftop circuit",
  "Late-night dining",
  "Downtown run",
  "Lounge to dance floor",
  "After-hours energy",
] as const;

type NightPlanRecord = {
  id?: string;
  title: string;
  city: string;
  vibeLane: string;
  startStop: string;
  midStop: string;
  peakStop: string;
  lateStop: string;
  status?: string;
};

function readLocalPlans() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || "[]") as NightPlanRecord[];
  } catch {
    return [];
  }
}

function writeLocalPlans(plans: NightPlanRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
}

export default function NightBuilderStudio({
  defaultCity = "Baltimore",
}: {
  defaultCity?: string;
}) {
  const { upsertItem } = useSavedItems();
  const [plans, setPlans] = useState<NightPlanRecord[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [form, setForm] = useState<NightPlanRecord>({
    title: "",
    city: defaultCity,
    vibeLane: DEFAULT_LANES[0],
    startStop: "",
    midStop: "",
    peakStop: "",
    lateStop: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const localPlans = readLocalPlans();
      if (active) setPlans(localPlans);
      try {
        const response = await fetch("/api/night-plans", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as { signedIn?: boolean; plans?: NightPlanRecord[] };
        if (!active) return;
        if (response.ok && Array.isArray(payload.plans)) {
          setSignedIn(Boolean(payload.signedIn));
          setPlans(payload.plans.length ? payload.plans : localPlans);
        }
      } catch {
        // Local-only mode.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const completionScore = useMemo(() => {
    const fields = [form.startStop, form.midStop, form.peakStop, form.lateStop].filter(Boolean).length;
    return Math.round((fields / 4) * 100);
  }, [form.lateStop, form.midStop, form.peakStop, form.startStop]);

  async function trackLaneEvent(kind: "discovery_lane_explored" | "night_plan_created", metadata: Record<string, unknown>) {
    await fetch("/api/engagement/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: kind,
        city: form.city || defaultCity,
        referenceType: kind === "night_plan_created" ? "night_plan" : "vibe_lane",
        referenceId: form.vibeLane.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        dedupeKey: `${kind}:${form.city}:${form.vibeLane}:${new Date().toISOString().slice(0, 10)}`,
        metadata,
      }),
      keepalive: true,
    }).catch(() => null);
  }

  async function savePlan() {
    setSubmitting(true);
    setMessage(null);
    const localPlan: NightPlanRecord = {
      ...form,
      id: `local-${Date.now()}`,
      status: "draft",
    };

    try {
      const response = await fetch("/api/night-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { plan?: NightPlanRecord };
        const nextPlan = payload.plan || localPlan;
        const nextPlans = [nextPlan, ...plans.filter((plan) => plan.id !== nextPlan.id)].slice(0, 8);
        setPlans(nextPlans);
        await upsertItem({
          intent: "plan",
          entityType: "night_plan",
          entityKey: nextPlan.id || nextPlan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          title: nextPlan.title,
          href: "/account",
          city: nextPlan.city,
          metadata: {
            vibeLane: nextPlan.vibeLane,
            sourceType: "evntszn_native",
            sourceLabel: "EVNTSZN Native",
          },
        });
        await trackLaneEvent("night_plan_created", {
          title: nextPlan.title,
          vibeLane: nextPlan.vibeLane,
          completionScore,
        });
        setSignedIn(true);
        setMessage("Night plan saved.");
      } else {
        const nextPlans = [localPlan, ...plans].slice(0, 8);
        setPlans(nextPlans);
        writeLocalPlans(nextPlans);
        await upsertItem({
          intent: "plan",
          entityType: "night_plan",
          entityKey: localPlan.id!,
          title: localPlan.title,
          href: "/enter",
          city: localPlan.city,
          metadata: {
            vibeLane: localPlan.vibeLane,
            localOnly: true,
            sourceType: "evntszn_native",
            sourceLabel: "EVNTSZN Native",
          },
        });
        await trackLaneEvent("night_plan_created", {
          title: localPlan.title,
          vibeLane: localPlan.vibeLane,
          completionScore,
          localOnly: true,
        });
        setMessage("Night plan saved locally. Sign in to sync it.");
      }
    } catch {
      const nextPlans = [localPlan, ...plans].slice(0, 8);
      setPlans(nextPlans);
      writeLocalPlans(nextPlans);
      setMessage("Night plan saved locally. Sign in to sync it.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-black/30 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="ev-section-kicker">Night Builder</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Build the night without waiting for an event card.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            Turn vibe lanes, reserve intent, and saved places into a structured run: start, mid, peak, late.
          </p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Plan depth</div>
          <div className="mt-1 text-2xl font-black text-white">{completionScore}%</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="ev-field" placeholder="Plan title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        <input className="ev-field" placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
        <select
          className="ev-field"
          value={form.vibeLane}
          onChange={(event) => {
            const nextLane = event.target.value;
            setForm((current) => ({ ...current, vibeLane: nextLane }));
            void trackLaneEvent("discovery_lane_explored", {
              vibeLane: nextLane,
              city: form.city || defaultCity,
            });
          }}
        >
          {DEFAULT_LANES.map((lane) => (
            <option key={lane} value={lane}>{lane}</option>
          ))}
        </select>
        <input className="ev-field" placeholder="Start" value={form.startStop} onChange={(event) => setForm((current) => ({ ...current, startStop: event.target.value }))} />
        <input className="ev-field" placeholder="Mid" value={form.midStop} onChange={(event) => setForm((current) => ({ ...current, midStop: event.target.value }))} />
        <input className="ev-field" placeholder="Peak" value={form.peakStop} onChange={(event) => setForm((current) => ({ ...current, peakStop: event.target.value }))} />
        <input className="ev-field md:col-span-2" placeholder="Late" value={form.lateStop} onChange={(event) => setForm((current) => ({ ...current, lateStop: event.target.value }))} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || !form.title || !form.city}
          onClick={() => void savePlan()}
          className="ev-button-primary disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Build your night"}
        </button>
        <div className="ev-chip ev-chip--external">{signedIn ? "Saved to account" : "Guest mode supported"}</div>
      </div>

      {message ? (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {plans.length ? plans.slice(0, 3).map((plan) => (
          <div key={plan.id || plan.title} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-white">{plan.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#caa7ff]">{plan.vibeLane || "Custom lane"} · {plan.city}</div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{plan.status || "draft"}</div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {[plan.startStop, plan.midStop, plan.peakStop, plan.lateStop].map((stop, index) => (
                <div key={`${plan.title}-${index}`} className="rounded-[16px] border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/68">
                  {stop || ["Start", "Mid", "Peak", "Late"][index]}
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/60">
            Save your first night plan to turn planning into a real progression loop.
          </div>
        )}
      </div>
    </section>
  );
}
