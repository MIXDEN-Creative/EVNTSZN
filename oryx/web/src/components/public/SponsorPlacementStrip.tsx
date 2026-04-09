import Image from "next/image";
import Link from "next/link";
import type { SponsorPlacement } from "@/lib/sponsor-placements";
import { getFaviconFallbackUrl, getLogoFallbackUrl } from "@/lib/external-integrations";

export default function SponsorPlacementStrip({
  placements,
  eyebrow,
  headline,
  body,
  compact = false,
}: {
  placements: SponsorPlacement[];
  eyebrow: string;
  headline: string;
  body?: string;
  compact?: boolean;
}) {
  if (!placements.length) return null;

  return (
    <section className={`rounded-[32px] border border-white/10 bg-[#0c0c15] ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">{eyebrow}</div>
        <h2 className={`mt-3 font-black tracking-tight text-white ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}>{headline}</h2>
        {body ? <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">{body}</p> : null}
      </div>

      <div className={`mt-6 grid gap-4 ${compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {placements.map((placement) => {
          const content = (
            <>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/[0.08]">
                {placement.logo_url ? (
                  <div className="flex h-16 items-center">
                    <Image
                      src={placement.logo_url || getLogoFallbackUrl(placement.website_url) || getFaviconFallbackUrl(placement.website_url) || ""}
                      alt={placement.name}
                      width={180}
                      height={56}
                      unoptimized
                      className="max-h-14 w-auto max-w-[180px] object-contain"
                    />
                  </div>
                ) : placement.website_url ? (
                  <div className="flex h-16 items-center">
                    <Image
                      src={getLogoFallbackUrl(placement.website_url) || getFaviconFallbackUrl(placement.website_url) || ""}
                      alt={placement.name}
                      width={180}
                      height={56}
                      unoptimized
                      className="max-h-14 w-auto max-w-[180px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 items-center text-lg font-bold text-white">{placement.name}</div>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{placement.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{placement.type}</div>
                  </div>
                  {placement.is_featured ? <span className="ev-chip ev-chip--featured">Featured</span> : null}
                </div>
                {placement.website_url ? (
                  <div className="mt-4 text-sm font-semibold text-[#d8c2ff]">{placement.cta_label || "Visit"}</div>
                ) : null}
              </div>
            </>
          );

          return placement.website_url ? (
            <Link key={placement.id} href={placement.website_url} target="_blank" rel="noreferrer" className="block">
              {content}
            </Link>
          ) : (
            <div key={placement.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
