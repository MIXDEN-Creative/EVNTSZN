import Image from "next/image";
import Link from "next/link";
import { getAppOrigin, getEplOrigin, getReserveOrigin, getWebOrigin } from "@/lib/domains";
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
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">Sponsors & partners</div>
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
            <Link href={`${getWebOrigin()}/`} className="text-2xl font-black tracking-tight text-white">EVNTSZN™</Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
              EVNTSZN brings together nights out, live games, concerts, EPL, and city plans people actually want to keep up with.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Explore</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href={`${getWebOrigin()}/`}>Discover</Link>
              <Link href={`${getWebOrigin()}/events`}>Events</Link>
              <Link href={`${getEplOrigin()}/`}>EPL</Link>
              <Link href={`${getWebOrigin()}/link`}>EVNTSZN Link</Link>
              <Link href={`${getReserveOrigin()}/reserve`}>EVNTSZN Reserve</Link>
              <Link href={`${getWebOrigin()}/venue-program`}>Venue Plans</Link>
              <Link href={`${getWebOrigin()}/venue-agreement`}>Venue Agreement</Link>
              <Link href={`${getEplOrigin()}/opportunities`}>EPL Opportunities</Link>
              <Link href={`${getWebOrigin()}/hosts`}>Host Program</Link>
              <Link href={`${getWebOrigin()}/organizer/apply`}>Independent Organizer</Link>
              <Link href={`${getWebOrigin()}/crew`}>Crew Marketplace</Link>
              <Link href={`${getWebOrigin()}/signal/apply`}>Signal</Link>
              <Link href={`${getWebOrigin()}/ambassador/apply`}>Ambassador</Link>
              <Link href={`${getWebOrigin()}/partners/packages`}>Sponsor Packages</Link>
              <Link href={`${getEplOrigin()}/store`}>Store</Link>
              <Link href={`${getWebOrigin()}/support`}>Support</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Cities</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              {PUBLIC_CITIES.map((city) => (
                <Link key={city.slug} href={`${getWebOrigin()}/${city.slug}`}>
                  {city.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Trust</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href={`${getAppOrigin()}/account/login`}>Sign In</Link>
              <Link href={`${getAppOrigin()}/account/register?next=/account`}>Create member account</Link>
              <Link href={`${getWebOrigin()}/privacy`}>Privacy Policy</Link>
              <Link href={`${getWebOrigin()}/terms`}>Terms</Link>
              <Link href={`${getWebOrigin()}/refund-policy`}>Refund Policy</Link>
              <Link href={`${getWebOrigin()}/liability-notice`}>Liability Notice</Link>
              <Link href={`${getWebOrigin()}/support`}>Support Desk</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
