"use client";

import { useState } from "react";
import type { PulseFeedItem } from "@/lib/pulse";

type PulseFeedClientProps = {
  scope: "public" | "internal";
  initialItems: PulseFeedItem[];
  canPost?: boolean;
  canManage?: boolean;
  manageVisibility?: boolean;
  canFlag?: boolean;
};

export default function PulseFeedClient({
  scope,
  initialItems,
  canPost = false,
  canManage = false,
  manageVisibility = false,
  canFlag = false,
}: PulseFeedClientProps) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">(scope);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const featuredItems = items.filter((item) => item.isFeatured || item.isBolt).slice(0, 5);
  const liveItems = items.slice(0, 12);

  const scopeCopy =
    scope === "internal"
      ? {
          rail: "Internal lane",
          title: "Ops, staffing, reserve routing, and city signals.",
          body: "Keep internal actions separate from public discovery while still ranking the strongest signals first.",
        }
      : {
          rail: "Public lane",
          title: "Where the city sees what is actually moving.",
          body: "Events, rooms, reserve pressure, and sponsor visibility should feel live, fast, and worth opening.",
        };

  async function refresh() {
    const response = await fetch(`/api/pulse/feed?scope=${scope}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { items?: PulseFeedItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not load Pulse.");
    }
    setItems(payload.items || []);
  }

  async function submitPost(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/pulse/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          city: city || null,
          visibility,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not publish Pulse post.");
      setTitle("");
      setBody("");
      setCity("");
      setMessage("Pulse updated.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish Pulse post.");
    } finally {
      setLoading(false);
    }
  }

  async function archivePost(postId: string) {
    try {
      const response = await fetch("/api/pulse/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          status: "archived",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not archive Pulse post.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not archive Pulse post.");
    }
  }

  async function flagPost(postId: string) {
    try {
      const response = await fetch("/api/pulse/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag_post",
          pulsePostId: postId,
          reason: "Flagged by member review",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not flag post.");
      setMessage("Pulse post flagged for review.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not flag post.");
    }
  }

  return (
    <div className="space-y-6">
      {canPost ? (
        <form onSubmit={submitPost} className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">{scope === "internal" ? "Internal Pulse update" : "Public Pulse update"}</div>
              <div className="mt-2 text-2xl font-black text-white">Publish a clean signal.</div>
            </div>
            {manageVisibility ? (
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as "public" | "internal")}
                className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
              </select>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="ev-field" placeholder="Headline" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <input className="ev-field" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          </div>
          <textarea className="ev-textarea mt-4" rows={4} placeholder="What changed, what matters, and what should happen next?" value={body} onChange={(event) => setBody(event.target.value)} required />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="ev-button-primary disabled:opacity-50">
              {loading ? "Publishing..." : "Publish Pulse"}
            </button>
            <button type="button" onClick={() => refresh().catch((error) => setMessage(error.message))} className="ev-button-secondary">
              Refresh
            </button>
          </div>
        </form>
      ) : null}

      {message ? <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">{message}</div> : null}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(162,89,255,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="ev-section-kicker">{scopeCopy.rail}</div>
            <div className="mt-3 text-3xl font-black text-white md:text-4xl">{scopeCopy.title}</div>
            <div className="mt-3 max-w-3xl text-sm leading-7 text-white/68">{scopeCopy.body}</div>
          </div>
          <button type="button" onClick={() => refresh().catch((error) => setMessage(error.message))} className="ev-button-secondary">
            Refresh feed
          </button>
        </div>

        {featuredItems.length ? (
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
            {featuredItems.map((item) => (
              <article key={`featured-${item.id}`} className="min-w-[260px] flex-1 rounded-[28px] border border-white/10 bg-black/35 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#a259ff]/30 bg-[#a259ff]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">
                    {item.isBolt ? "Bolt visibility" : "Featured signal"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{item.city || "Multi-city"}</span>
                </div>
                <div className="mt-5 text-2xl font-black text-white">{item.title}</div>
                <div className="mt-3 text-sm leading-6 text-white/68">{item.body}</div>
                <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{item.sourceLabel}</span>
                  {item.pulseScore !== null ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Pulse {item.pulseScore.toFixed(1)}</span> : null}
                  {item.reservationSignal ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{item.reservationSignal.replace(/_/g, " ")}</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.32fr_0.68fr]">
        <aside className="space-y-4 rounded-[32px] border border-white/10 bg-white/[0.03] p-5">
          <div>
            <div className="ev-section-kicker">Live pulse</div>
            <div className="mt-3 text-xl font-black text-white">Signals ranked by room energy, timing, and trust.</div>
          </div>
          <div className="grid gap-3">
            {liveItems.slice(0, 4).map((item, index) => (
              <div key={`rail-${item.id}`} className="rounded-[24px] border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">#{index + 1} now moving</div>
                <div className="mt-2 text-base font-black text-white">{item.title}</div>
                <div className="mt-2 text-xs leading-6 text-white/60">{item.city || item.sourceLabel}</div>
              </div>
            ))}
            {!items.length ? (
              <div className="rounded-[24px] border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                No Pulse signals yet.
              </div>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-4">
          {items.map((item, index) => (
          <article
            key={item.id}
            className={`rounded-[30px] border p-5 ${
              index === 0
                ? "border-[#a259ff]/25 bg-[linear-gradient(135deg,rgba(162,89,255,0.18),rgba(255,255,255,0.04))]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7c0ff]">
                  {item.sourceLabel}
                </span>
                {item.isBolt ? (
                  <span className="rounded-full border border-[#a259ff]/30 bg-[#a259ff]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0e5ff]">
                    ⚡ Bolt
                  </span>
                ) : null}
                {item.city ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                    {item.city}
                  </span>
                ) : null}
              </div>
              <div className="text-right text-xs text-white/45">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="text-2xl font-black text-white md:text-[2rem]">{item.title}</div>
              {item.isFeatured ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Featured
                </span>
              ) : null}
            </div>
            <div className="mt-3 text-sm leading-7 text-white/68">{item.body}</div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/48">
              {item.pulseScore !== null ? <div>Pulse {item.pulseScore.toFixed(1)}</div> : null}
              {item.reservationSignal ? <div>Reserve {item.reservationSignal.replace(/_/g, " ")}</div> : null}
              <div>{item.visibility === "internal" ? "Internal only" : "Public-safe"}</div>
            </div>
            {canManage && item.sourceType === "pulse_post" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => archivePost(item.id)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                  Archive
                </button>
                {canFlag && item.visibility === "public" ? (
                  <button type="button" onClick={() => flagPost(item.id)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                    Flag
                  </button>
                ) : null}
              </div>
            ) : canFlag && item.visibility === "public" ? (
              <div className="mt-4">
                <button type="button" onClick={() => flagPost(item.id)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                  Flag
                </button>
              </div>
            ) : null}
          </article>
        ))}
        </div>
      </div>
    </div>
  );
}
