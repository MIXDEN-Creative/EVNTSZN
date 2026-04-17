"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { EvntsznSurface } from "@/lib/domains";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";
import { useNavSession } from "@/components/navigation/useNavSession";

export default function SurfaceShell({
  surface,
  eyebrow,
  title,
  description,
  actions,
  meta,
  children,
  className,
}: {
  surface: EvntsznSurface;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { session } = useNavSession();

  return (
    <main className={["ev-surface", `ev-surface--${surface}`, className].filter(Boolean).join(" ")}>
      <div className="ev-shell">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-black/40 px-4 py-4 backdrop-blur-2xl md:mb-8 md:px-5 lg:sticky lg:top-5 lg:z-30">
          <Link href={getWebOrigin()} className="flex items-center gap-3 transition hover:opacity-90" aria-label="EVNTSZN home">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="40px" className="object-cover" />
            </div>
            <span className="flex flex-col">
              <span className="text-lg font-black tracking-[0.16em] text-white leading-tight">EVNTSZN</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff] leading-tight">
                {surface.toUpperCase()}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {session.signedIn && session.dashboardHref && session.dashboardLabel ? (
              <Link href={`${getAppOrigin()}${session.dashboardHref}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white">
                {session.dashboardLabel}
              </Link>
            ) : null}
            {surface !== "epl" ? (
              <Link href={`${getEplOrigin()}/`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white">
                League
              </Link>
            ) : null}
            {session.signedIn ? (
              <form action={session.signOutHref} method="POST">
                <button type="submit" className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white">
                  Sign Out
                </button>
              </form>
            ) : null}
            <Link href={getWebOrigin()} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10 hover:text-white">
              Return to discovery
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </header>

        {open && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-2 md:mb-8 md:hidden">
            <div className="grid gap-1">
              {session.signedIn && session.dashboardHref && session.dashboardLabel ? (
                <Link href={`${getAppOrigin()}${session.dashboardHref}`} className="rounded-2xl px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
                  {session.dashboardLabel}
                </Link>
              ) : null}
              <Link href={`${getEplOrigin()}/`} className="rounded-2xl px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
                League
              </Link>
              <Link href={`${getAppOrigin()}/account`} className="rounded-2xl px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
                Account
              </Link>
              {session.signedIn ? (
                <form action={session.signOutHref} method="POST">
                  <button type="submit" className="w-full rounded-2xl px-5 py-3 text-left text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
                    Sign Out
                  </button>
                </form>
              ) : null}
              <Link href={getWebOrigin()} className="rounded-2xl px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white">
                Discovery
              </Link>
            </div>
          </div>
        )}
        <section className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">{eyebrow}</div>
              <h1 className="ev-title">{title}</h1>
              <p className="ev-subtitle">{description}</p>
              {actions ? <div className="mt-6 flex flex-wrap gap-3 md:mt-8">{actions}</div> : null}
            </div>
            {meta ? <div className="ev-hero-meta">{meta}</div> : null}
          </div>
        </section>

        <div className="mt-6 md:mt-8">{children}</div>
      </div>
    </main>
  );
}
