import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import PublicFooter from "@/components/public/PublicFooter";
import { DEFAULT_EPL_PUBLIC_CONTENT } from "@/lib/site-content";

export default function EplNotFoundPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={DEFAULT_EPL_PUBLIC_CONTENT.menu} />
      <section className="mx-auto max-w-5xl px-4 py-20 text-center md:px-6 lg:px-8 lg:py-24">
        <div className="inline-flex rounded-full border border-[#A259FF]/30 bg-[#A259FF]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d8c2ff]">
          EPL
        </div>
        <h1 className="mt-6 text-5xl font-black tracking-tight text-white">That league page is off the board.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/72">
          The page you tried to open is not active. Jump back into the league through the pages people actually use during the season.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/epl" className="ev-button-primary">
            Back to EPL
          </Link>
          <Link href="/epl/season-1/register" className="ev-button-secondary">
            Register
          </Link>
          <Link href="/epl/teams" className="ev-button-secondary">
            View teams
          </Link>
          <Link href="/epl/standings" className="ev-button-secondary">
            View standings
          </Link>
          <Link href="/epl/opportunities" className="ev-button-secondary">
            Opportunities
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
