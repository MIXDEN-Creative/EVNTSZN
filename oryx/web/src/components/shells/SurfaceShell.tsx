import Image from "next/image";
import Link from "next/link";
import type { EvntsznSurface } from "@/lib/domains";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";

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
  return (
    <main className={["ev-surface", `ev-surface--${surface}`, className].filter(Boolean).join(" ")}>
      <div className="ev-shell">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-black/25 px-4 py-4 backdrop-blur-xl">
          <Link href={getWebOrigin()} className="flex items-center gap-3" aria-label="EVNTSZN home">
            <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="44px" className="object-cover" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white">EVNTSZN</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                {surface === "epl" ? "League nights and season action" : surface === "app" ? "Member account and attendee access" : "Live events and city plans"}
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link href={`${getAppOrigin()}/account`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
              Member account
            </Link>
            {surface !== "epl" ? (
              <Link href={`${getEplOrigin()}/`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                EPL
              </Link>
            ) : null}
            <Link href={`${getWebOrigin()}/support`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
              Support
            </Link>
            <Link href={getWebOrigin()} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
              Return to homepage
            </Link>
          </div>
        </div>
        <section className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">{eyebrow}</div>
              <h1 className="ev-title">{title}</h1>
              <p className="ev-subtitle">{description}</p>
              {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
            </div>
            {meta ? <div className="ev-hero-meta">{meta}</div> : null}
          </div>
        </section>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
