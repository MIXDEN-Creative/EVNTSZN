import type { EvntsznSurface } from "@/lib/domains";

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
