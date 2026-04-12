import Link from "next/link";
import { getEplOrigin } from "@/lib/domains";
import DraftHostConsole from "./DraftHostConsole";

export default function EPLDraftAdminPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Draft Control</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Commissioner Draft Console</h1>
          <p className="mt-3 text-white/65">
            Access the player pool, team-needs board, live draftboard display, and pick controls from one place. Use this desk to manage and edit the live board on draft night.
          </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Live display</div>
            <div className="mt-2 text-lg font-semibold text-white">Draftboard screen</div>
            <p className="mt-2 text-sm text-white/60">
              Open the public-facing draftboard in a separate tab or route it to the display machine before picks begin.
            </p>
            <a
              href={`${getEplOrigin()}/draft/season-1`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-2xl bg-[#A259FF] px-4 py-3 text-sm font-semibold text-white"
            >
              Open live draftboard
            </a>
          </div>
        </div>

        <DraftHostConsole />
      </div>
    </main>
  );
}
