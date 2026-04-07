import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getWebOrigin } from "@/lib/domains";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import SponsorPackagesClient from "./SponsorPackagesClient";

export const metadata: Metadata = {
  title: "Sponsorship Packages | EVNTSZN",
  description: "Explore EVNTSZN and EPL sponsorship packages, compare placements, and start a paid partnership or inquiry.",
  alternates: {
    canonical: `${getWebOrigin()}/partners/packages`,
  },
};

export default async function SponsorPackagesPage() {
  const supabase = getSupabaseAdmin();
  const { data: packages } = await supabase
    .schema("epl")
    .from("sponsorship_packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const livePackages = (packages || []) as {
    id: string;
    package_name: string;
    description: string | null;
    cash_price_cents: number;
    benefits: string[] | null;
  }[];

  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Sponsorships & partnerships</div>
        <h1 className="ev-title max-w-4xl">Put your brand inside EVNTSZN and EPL where the crowd actually feels it.</h1>
        <p className="ev-subtitle max-w-3xl">
          Sponsorship packages are managed live through the EVNTSZN command layer. Choose a package, submit interest, or purchase directly when a package is open for checkout.
        </p>

        <SponsorPackagesClient packages={livePackages} />
      </section>
    </PublicPageFrame>
  );
}
