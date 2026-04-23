import Image from "next/image";
import Link from "next/link";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { getFaviconFallbackUrl, getLogoFallbackUrl } from "@/lib/external-integrations";
import type { SponsorPlacement } from "@/lib/sponsor-placements";
import type { PublicModules } from "@/lib/site-content";

export default function PublicFooterShell({
  placements,
  modules,
}: {
  placements: SponsorPlacement[];
  modules: PublicModules;
}) {
  return (
    <footer className="border-t border-white/10 bg-black/90">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-16">
        {placements.length ? (
          <div className="mb-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">Sponsors</div>
            <h2 className="mt-3 max-w-3xl text-2xl font-black tracking-tight text-white">{modules.sponsorBlock.footerHeadline}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {placements.map((placement) => (
                <a
                  key={placement.id}
                  href={placement.website_url || "#"}
                  target={placement.website_url ? "_blank" : undefined}
                  rel={placement.website_url ? "noreferrer" : undefined}
                  className="rounded-[22px] border border-white/10 bg-black/30 p-4 transition hover:bg-white/[0.08]"
                >
                  {placement.logo_url || placement.website_url ? (
                    <Image
                      src={placement.logo_url || getLogoFallbackUrl(placement.website_url) || getFaviconFallbackUrl(placement.website_url) || ""}
                      alt={placement.name}
                      width={160}
                      height={48}
                      unoptimized
                      className="h-12 w-auto max-w-[160px] object-contain"
                    />
                  ) : (
                    <div className="text-lg font-bold text-white">{placement.name}</div>
                  )}
                  <div className="mt-3 text-sm font-semibold text-white">{placement.name}</div>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
          <div>
            <Link href="/" className="text-2xl font-black tracking-tight text-white">EVNTSZN™</Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
              EVNTSZN is the operating environment for discovery, bookings, league operations, crew, venues, and premium city movement.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Platform</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href="/">Discover</Link>
              <Link href="/events">Events</Link>
              <Link href="/pulse">Pulse</Link>
              <Link href="/reserve">Reserve</Link>
              <Link href="/crew">Crew Marketplace</Link>
              <Link href="/link">Link</Link>
              <Link href="/epl">EPL</Link>
              <Link href="/venue">Venue</Link>
              <Link href="/venue/pro">Venue Pro</Link>
              <Link href="/venue/pro-reserve">Venue Pro + Reserve</Link>
              <Link href="/tap-to-pour">Tap to Pour</Link>
              <Link href="/nodes">Nodes</Link>
              <Link href="/stayops">StayOps</Link>
              <Link href="/operate">Operate</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Programs</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href="/hosts">Curator Network</Link>
              <Link href="/partners">Partner Program</Link>
              <Link href="/sponsors">Sponsors</Link>
              <Link href="/venue-program">Venue Plans</Link>
              <Link href="/venue/agreement">Venue Agreement</Link>
              <Link href="/epl/opportunities">EPL Opportunities</Link>
              <Link href="/signal/apply">Signal</Link>
              <Link href="/support">Support</Link>
              {PUBLIC_CITIES.map((city) => (
                <Link key={city.slug} href={`/city/${city.slug}`}>
                  {city.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Entry</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href="/enter">Sign In / Enter</Link>
              <Link href="/account/login?next=/account">Member Sign In</Link>
              <Link href="/account/register?next=/account">Create member account</Link>
              <Link href="/admin-login?next=/ops">Internal access</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refund-policy">Refund Policy</Link>
              <Link href="/liability-notice">Liability Notice</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
