import type { Metadata } from "next";
import Link from "next/link";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { getEplOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Season 1 Schedule | EPL",
  description: "Official Season 1 schedule for EVNTSZN Prime League. Roster nights, draft night, and game-day matchups.",
  alternates: {
    canonical: `${getEplOrigin()}/schedule`,
  },
};

export default function EPLSchedulePage() {
  return (
    <SurfaceShell
      surface="epl"
      eyebrow="League rhythm"
      title="Season 1 Schedule"
      description="The official roadmap for EPL Season 1. From registration deadlines to draft night and the live game-day matchups that follow."
    >
      <div className="ev-panel p-10 md:p-16 lg:p-20 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-8">
            <svg className="h-10 w-10 text-[#caa7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">Schedule is being finalized.</h2>
        <p className="mt-6 text-lg text-white/60 max-w-xl leading-relaxed">
          We are currently mapping the Season 1 matchups, field allocations, and draft-night flow. 
          The full schedule will be released here following the Draft Night on Saturday, June 20.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/epl" className="ev-button-primary px-8">
                Back to EPL home
            </Link>
            <Link href="/epl/season-1/register" className="ev-button-secondary px-8">
                Register to play
            </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { label: "Draft Night", value: "Saturday, June 20", note: "The official league intake and team assignment night." },
          { label: "Opening Day", value: "Coming soon", note: "The first live game-day sessions for Season 1." },
          { label: "Championship", value: "TBA", note: "The season finale where the league champion is crowned." },
        ].map((item) => (
          <div key={item.label} className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
              Key Date
            </div>
            <div className="mt-4 text-2xl font-black text-white">{item.value}</div>
            <div className="mt-2 text-sm text-[#caa7ff] font-bold uppercase tracking-widest">{item.label}</div>
            <p className="mt-4 text-sm text-white/50 leading-relaxed">{item.note}</p>
          </div>
        ))}
      </div>
    </SurfaceShell>
  );
}
