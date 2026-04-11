import Link from "next/link";
import type { EplMenuVisibilityContent } from "@/lib/site-content";
import { getWebOrigin } from "@/lib/domains";

export default function EplNav({ menu }: { menu: EplMenuVisibilityContent }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href={getWebOrigin()} className="text-lg font-black tracking-tight text-white">
            EVNTSZN
          </Link>
          <Link href="/epl" className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white">
            EPL
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {menu.showDraftCountdown ? (
            <Link href="/epl#countdown" className="text-sm font-medium text-white/80 transition hover:text-white">
              Draft Countdown
            </Link>
          ) : null}
          {menu.showSchedule ? (
            <Link href="/epl#schedule" className="text-sm font-medium text-white/80 transition hover:text-white">
              Schedule
            </Link>
          ) : null}
          {menu.showTeams ? (
            <Link href="/epl/teams" className="text-sm font-medium text-white/80 transition hover:text-white">
              Teams
            </Link>
          ) : null}
          {menu.showOpportunities ? (
            <Link href="/epl/opportunities" className="text-sm font-medium text-white/80 transition hover:text-white">
              Opportunities
            </Link>
          ) : null}
          {menu.showStandings ? (
            <Link href="/epl/standings" className="text-sm font-medium text-white/80 transition hover:text-white">
              Standings
            </Link>
          ) : null}
          {menu.showStore ? (
            <Link href="/epl/store" className="text-sm font-medium text-white/80 transition hover:text-white">
              Store
            </Link>
          ) : null}
          <Link href={`${getWebOrigin()}/support`} className="text-sm font-medium text-white/80 transition hover:text-white">
            Support
          </Link>
          {menu.showRegister ? (
            <Link href="/epl/season-1/register" className="text-sm font-medium text-white/80 transition hover:text-white">
              Register
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={getWebOrigin()}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            EVNTSZN
          </a>
          {menu.showRegister ? (
            <Link
              href="/epl/season-1/register"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Register
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
