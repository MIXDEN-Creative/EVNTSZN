import Link from "next/link";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";
import { PUBLIC_CITIES } from "@/lib/public-cities";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/90">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
          <div>
            <div className="text-2xl font-black tracking-tight text-white">EVNTSZN™</div>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
              Premium event discovery for nightlife, music, sports, city moments, and league energy. Powered by ORYX. ORYX is a product of MIXDEN Creative.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/48">Explore</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/78">
              <Link href={`${getWebOrigin()}/`}>Discover</Link>
              <Link href={`${getWebOrigin()}/events`}>Events</Link>
              <Link href={`${getEplOrigin()}/`}>EPL</Link>
              <Link href={`${getEplOrigin()}/store`}>Store</Link>
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
              <Link href={`${getAppOrigin()}/account/login?mode=signup&next=/account`}>Create Account</Link>
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
