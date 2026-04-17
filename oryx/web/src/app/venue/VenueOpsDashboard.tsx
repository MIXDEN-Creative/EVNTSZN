"use client";

import { useState } from "react";
import { getCanonicalUrl } from "@/lib/domains";
import PerformanceScorePanel from "@/components/performance/PerformanceScorePanel";

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
      <div className="ev-section-frame">
        <div className="ev-dashboard-hero">
        <h2 className="text-2xl font-semibold">Venue Access Required</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Activate your venue profile to launch event scanners, manage gate throughput, and track real-time attendance.
        </p>
        <button
          onClick={activateVenueWorkspace}
          disabled={loading}
          className="mt-6 rounded-2xl bg-white px-5 py-3 font-semibold text-black active:scale-95 disabled:opacity-50"
        >
          {loading ? "Activating..." : "Set up venue access"}
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-dashboard-shell">
      <PerformanceScorePanel scope="venue" title="V-Score" />
      <div className="ev-section-frame">
        <div className="ev-dashboard-hero">
        <div className="ev-section-kicker">Venue readiness</div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">See what needs attention before doors open.</h2>
        <div className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
          Venue operations keep scanner status, occupancy pressure, and event-day support in one lane. Crew recommendations stay tied to room format and service load instead of getting buried in notes.
        </div>
        </div>
      </div>
      {events.map((event) => (
        <div key={event.id} className="ev-section-frame ev-section-frame--muted">
          <div className="ev-dashboard-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#A259FF]">
                {event.city}, {event.state}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.04em]">{event.title}</div>
              <div className="mt-3 text-sm text-white/60">
                {new Date(event.start_at).toLocaleString("en-US", { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })} · <span className="uppercase tracking-wide text-white/40">Scanner: {event.scanner_status}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 lg:w-1/2 lg:justify-end">
              <div className="min-w-[220px] flex-1 lg:flex-none rounded-[22px] border border-white/10 bg-black/25 p-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span>Occupancy</span>
                  <span>{event.check_in_count || 0}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <div 
                    className="h-full bg-[#A259FF] transition-all duration-500" 
                    style={{ width: `${Math.min((event.check_in_count / 100) * 100, 100)}%` }} 
                  />
                </div>
              </div>
              
              <a
                href={getCanonicalUrl(`/scanner/${event.slug}`, "scanner", window.location.host)}
                className="ev-button-primary"
              >
                Open scanner
              </a>
            </div>
          </div>
          </div>
        </div>
      ))}

      {!events.length ? (
        <div className="ev-empty-state">
          No venue-assigned events yet. Organizers can connect venue ops through EVNTSZN staffing and event assignments.
        </div>
      ) : null}
    </div>
  );
}
