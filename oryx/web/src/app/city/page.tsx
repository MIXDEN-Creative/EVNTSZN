import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "City guides for events, nightlife, reservations, and venues | EVNTSZN",
  description:
    "Browse EVNTSZN city guides for Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach across events, nightlife, reservations, and venues.",
  path: "/city",
});

export default function CityIndexPage() {
  return (
    <PublicPageFrame
      title="City search ownership starts here."
      description="EVNTSZN city guides are built to rank for nightlife, events, reservations, venues, and things to do tonight across the markets we operate."
      heroImage="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Cities", path: "/city" },
      ]}
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN city guides",
        description:
          "EVNTSZN city guides cover nightlife, events, reservations, and venues across priority markets.",
        path: "/city",
      })}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {PUBLIC_CITIES.map((city) => (
            <Link key={city.slug} href={`/city/${city.slug}`} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{city.stateLabel}</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{city.name}</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">{city.experienceBlurb}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/48">
                <span>Events</span>
                <span>Nightlife</span>
                <span>Reservations</span>
                <span>Venues</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicPageFrame>
  );
}
