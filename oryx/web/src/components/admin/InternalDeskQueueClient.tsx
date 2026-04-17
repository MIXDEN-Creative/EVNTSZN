"use client";

import { useEffect, useState } from "react";

type WorkItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  payload?: Record<string, unknown> | null;
};

async function fetchDeskItems(activeDeskSlug: string, activeDeskLabel: string) {
  const response = await fetch(`/api/admin/internal-os/work-items?desk=${encodeURIComponent(activeDeskSlug)}`, {
    cache: "no-store",
  });
  const json = (await response.json()) as { items?: WorkItem[]; error?: string };
  if (!response.ok) throw new Error(json.error || `Could not load ${activeDeskLabel}.`);
  return json.items || [];
}

export default function InternalDeskQueueClient({
  deskSlug,
  deskLabel,
  title,
  description,
}: {
  deskSlug: string;
  deskLabel: string;
  title: string;
  description: string;
}) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDeskItems(deskSlug, deskLabel)
      .then(setItems)
      .catch((error) => setMessage(error.message));
  }, [deskLabel, deskSlug]);

  async function updateItem(id: string, status: string) {
    try {
      const response = await fetch("/api/admin/internal-os/work-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update work item.");
      setItems(await fetchDeskItems(deskSlug, deskLabel));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update work item.");
    }
  }

  return (
    <div className="space-y-8">
      {message ? <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{message}</div> : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">{deskLabel}</div>
        <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">{description}</p>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Work queue</div>
        <div className="mt-6 space-y-4">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-white/55">{item.description || "No description."}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{item.priority}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{item.status}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["open", "in_progress", "completed", "blocked", "cancelled"].map((status) => (
                    <button key={status} type="button" onClick={() => updateItem(item.id, status)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72">
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 text-sm text-white/62">
              No open work items are currently routed into this desk.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
