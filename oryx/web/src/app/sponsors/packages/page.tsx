import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import SponsorPackagesClient from "@/app/partners/packages/SponsorPackagesClient";

const FALLBACK_PACKAGES = [
  {
    id: "city-activation",
    package_name: "City Activation",
    description: "Premium brand visibility across events, Pulse, venue moments, and city-specific discovery.",
    cash_price_usd: 1500,
    benefits: ["Event sponsorship", "Pulse placement", "Venue visibility", "City activation strategy"],
  },
  {
    id: "epl-sponsor",
    package_name: "EPL Sponsor",
    description: "League-side brand presence across schedule, clubs, supporter energy, and season movement.",
    cash_price_usd: 2500,
    benefits: ["League visibility", "Game-night presence", "Club and standings adjacency", "Sponsor desk follow-through"],
  },
  {
    id: "presenting-partner",
    package_name: "Presenting Partner",
    description: "High-visibility commercial lane spanning discovery, events, Pulse, EPL, and premium placements.",
    cash_price_usd: 5000,
    benefits: ["Premium placements", "Homepage and city visibility", "Sponsor activations", "Commercial planning support"],
  },
];

export const metadata: Metadata = {
  title: "Sponsor Packages | EVNTSZN",
  description: "Compare EVNTSZN sponsor packages, brand visibility lanes, city activations, and EPL sponsorship opportunities.",
  alternates: {
    canonical: `${getWebOrigin()}/sponsors/packages`,
  },
};

export default async function SponsorsPackagesPage() {
  let livePackages = FALLBACK_PACKAGES;

  try {
    const supabase = getSupabaseAdmin();
    const { data: packages } = await supabase
      .schema("epl")
      .from("sponsorship_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (packages?.length) {
      livePackages = packages as typeof FALLBACK_PACKAGES;
    }
  } catch {
    // Keep the sponsor package route operational with fallback package definitions.
  }

  return (
    <PublicPageFrame
      title="Sponsor packages that map to real EVNTSZN visibility."
      description="Brand visibility, event sponsorship, city activations, EPL sponsorship, and premium placement all route through one commercial sponsor system."
      heroImage="https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-[34px] border border-white/10 bg-[#0c0c15] p-7 md:p-9">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Sponsor System</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Packages built for events, Pulse, EPL, venues, and city activations.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Sponsors are a commercial operating lane inside EVNTSZN. This route is where brands compare packages, request a conversation, or move straight into checkout when the package is open.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sponsors/apply" className="ev-button-primary">Become a Sponsor</Link>
              <Link href="/sponsors" className="ev-button-secondary">Back to sponsors</Link>
              <Link href="/enter" className="ev-button-secondary">Enter EVNTSZN</Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {[
              "Events: sponsor the room, the crowd, and the moment.",
              "Pulse: extend brand visibility into public city energy and live movement.",
              "EPL + Venues: connect league presence and nightlife visibility in one commercial lane.",
            ].map((item) => (
              <div key={item} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/64">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:px-8">
        <SponsorPackagesClient packages={livePackages} />
      </section>
    </PublicPageFrame>
  );
}
