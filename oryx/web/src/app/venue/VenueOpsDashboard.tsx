"use client";

import { useState } from "react";
import { getCanonicalUrl } from "@/lib/domains";

type VenueEvent = {
  id: string;
  slug: string;
  title: string;
  start_at: string;
  scanner_status: string;
  check_in_count: number;
  city: string;
  state: string;
};

export default function VenueOpsDashboard({
  canOperate,
  events,
}: {
  canOperate: boolean;
  events: VenueEvent[];
}) {
  const [loading, setLoading] = useState(false);

  async function activateVenueWorkspace() {
    setLoading(true);
    await fetch("/api/evntszn/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryRole: "venue" }),
    });
    window.location.reload();
  }

  if (!canOperate) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-2xl font-semibold">Activate venue ops</h2>
        <p className="mt-3 max-w-2xl text-white/65">
          Claim the venue-facing EVNTSZN workspace for scanner launches, front-gate readiness,
          and event-day operational visibility.
        </p>
        <button
          onClick={activateVenueWorkspace}
          disabled={loading}
          className="mt-6 rounded-2xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Activating..." : "Activate venue workspace"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {events.map((event) => (
        <div key={event.id} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                {event.city}, {event.state}
              </div>
              <div className="mt-2 text-2xl font-semibold">{event.title}</div>
              <div className="mt-2 text-white/62">
                {new Date(event.start_at).toLocaleString()} · scanner: {event.scanner_status}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={getCanonicalUrl(`/scanner/${event.slug}`, "scanner", window.location.host)}
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                Open scanner
              </a>
              <div className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/72">
                Checked in: {event.check_in_count || 0}
              </div>
            </div>
          </div>
        </div>
      ))}

      {!events.length ? (
        <div className="rounded-[30px] border border-dashed border-white/15 bg-white/[0.02] p-6 text-white/58">
          No venue-assigned events yet. Organizers can connect venue ops through EVNTSZN staffing and event assignments.
        </div>
      ) : null}
    </div>
  );
}
