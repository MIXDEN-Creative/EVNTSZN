import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import SponsorPackagesClient from "./SponsorPackagesClient";

export const metadata: Metadata = {
  title: "Sponsorship Packages | EVNTSZN",
  description: "Explore EVNTSZN and EPL sponsorship packages, compare placements, and start a sponsor inquiry or checkout.",
  alternates: {
    canonical: `${getWebOrigin()}/partners/packages`,
  },
};

export default async function SponsorPackagesPage() {
  const fallbackPackages = [
    {
      id: "city-activation",
      package_name: "City Activation",
      description: "Premium city visibility across discovery, events, and Pulse.",
      cash_price_usd: 1500,
      benefits: ["Event sponsorship", "Pulse placement", "Venue visibility", "Brand activation support"],
    },
    {
      id: "epl-sponsor",
      package_name: "EPL Sponsor",
      description: "League sponsorship across teams, schedule, and game-night momentum.",
      cash_price_usd: 2500,
      benefits: ["League visibility", "Game-night presence", "Supporter-facing placement", "Sponsor desk support"],
    },
  ] as {
    id: string;
    package_name: string;
    description: string | null;
    cash_price_usd: number;
    benefits: string[] | null;
  }[];
  let livePackages = fallbackPackages;

  try {
    const supabase = getSupabaseAdmin();
    const { data: packages } = await supabase
      .schema("epl")
      .from("sponsorship_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (packages?.length) {
      livePackages = packages as typeof fallbackPackages;
    }
  } catch {
    livePackages = fallbackPackages;
  }

  return (
    <PublicPageFrame
      title="Sponsor packages"
      description="Compare EVNTSZN sponsor packages, then move into inquiry or checkout without leaving the commercial lane."
    >
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Sponsor packages</div>
        <h1 className="ev-title max-w-4xl">Put your brand inside EVNTSZN and EPL where the crowd actually feels it.</h1>
        <p className="ev-subtitle max-w-3xl">
          Sponsorship packages are managed live through the EVNTSZN command layer. Choose a package, submit sponsor interest, or purchase directly when a package is open for checkout.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/sponsors" className="ev-button-secondary">Back to sponsors</Link>
          <Link href="/sponsors/packages" className="ev-button-primary">Open sponsor system route</Link>
        </div>

        <SponsorPackagesClient packages={livePackages} />
      </section>
    </PublicPageFrame>
  );
}
