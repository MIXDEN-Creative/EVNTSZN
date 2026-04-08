import Link from "next/link";
import type { EvntsznSurface } from "@/lib/domains";
import { getWebOrigin } from "@/lib/domains";

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={getWebOrigin()} className="text-lg font-black tracking-tight text-white">
            EVNTSZN
          </Link>
          <Link href={getWebOrigin()} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
            Return to homepage
          </Link>
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
