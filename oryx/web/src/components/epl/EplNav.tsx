"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { EplMenuVisibilityContent } from "@/lib/site-content";
import { getAppOrigin, getWebOrigin } from "@/lib/domains";

export default function EplNav({ menu }: { menu: EplMenuVisibilityContent }) {
  const [open, setOpen] = useState(false);

  const navItems = [
    menu.showDraftCountdown ? { href: "/epl#countdown", label: "Draft Countdown" } : null,
    menu.showSchedule ? { href: "/epl#schedule", label: "Schedule" } : null,
    menu.showTeams ? { href: "/epl/teams", label: "Teams" } : null,
    menu.showOpportunities ? { href: "/epl/opportunities", label: "Opportunities" } : null,
    menu.showStandings ? { href: "/epl/standings", label: "Standings" } : null,
    menu.showStore ? { href: "/epl/store", label: "Store" } : null,
    { href: `${getWebOrigin()}/support`, label: "Support" },
    menu.showRegister ? { href: "/epl/season-1/register", label: "Register" } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href={getWebOrigin()} className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
            <span className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="40px" className="object-cover" />
            </span>
            <span className="flex flex-col">
              <span>EVNTSZN</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">League and game-night surface</span>
            </span>
          </Link>
          <Link href="/epl" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white">
            <span className="relative h-11 w-11 overflow-hidden">
              <Image src="/brand/epl-prime-league-logo.png" alt="EPL logo" fill sizes="44px" className="object-contain" />
            </span>
            <span className="hidden sm:inline">EPL</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-white/80 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`${getAppOrigin()}/account`}
            className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 md:inline-flex"
          >
            Member account
          </a>
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
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-black/92 px-4 py-4 md:hidden">
          <div className="grid gap-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                {item.label}
              </Link>
            ))}
            <a href={`${getAppOrigin()}/account`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Member account
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
