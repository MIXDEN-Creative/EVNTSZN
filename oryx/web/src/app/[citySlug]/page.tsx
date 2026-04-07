import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import SponsorPlacementStrip from "@/components/public/SponsorPlacementStrip";
import { getWebOrigin } from "@/lib/domains";
import { getDiscoveryNativeEvents } from "@/lib/discovery";
import { PUBLIC_CITIES, getPublicCityBySlug } from "@/lib/public-cities";
import { getPublicModulesContent } from "@/lib/site-content";
import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

type CityPageProps = {
  params: Promise<{ citySlug: string }>;
};

const CITY_HERO_IMAGES: Record<string, string> = {
  baltimore:
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1800&q=80",
  atlanta:
    "https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1800&q=80",
  newyork:
    "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1800&q=80",
  miami:
    "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=1800&q=80",
  dc:
    "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1800&q=80",
};

export async function generateStaticParams() {
  return PUBLIC_CITIES.map((city) => ({ citySlug: city.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getPublicCityBySlug(citySlug);

  if (!city) {
    return {};
  }

  return {
    title: city.seoTitle,
    description: city.seoDescription,
    alternates: {
      canonical: `${getWebOrigin()}/${city.slug}`,
    },
    openGraph: {
      title: `${city.seoTitle} | EVNTSZN`,
      description: city.seoDescription,
      url: `${getWebOrigin()}/${city.slug}`,
      type: "website",
    },
  };
}

export default async function PublicCityPage({ params }: CityPageProps) {
  const { citySlug } = await params;
  const city = getPublicCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const [nativeResult, externalEvents, modules, sponsorPlacements] = await Promise.all([
    getDiscoveryNativeEvents({ city: city.name, limit: 6 }),
    searchTicketmasterEvents({ city: city.name, size: 6 }).catch(() => []),
    getPublicModulesContent(),
    getPublicSponsorPlacements([`city:${city.slug}`, "city"]),
  ]);

  const cards = [
    ...nativeResult.events.map((event) => ({
      id: event.id,
      title: event.title,
      href: event.href,
      imageUrl: event.imageUrl || CITY_HERO_IMAGES[city.slug],
      venue: event.subtitle || event.heroNote || "EVNTSZN listing",
      date: event.startAt,
      badge: event.badgeLabel,
    })),
    ...externalEvents.map((event) => ({
      id: event.id,
      title: event.title,
      href: event.url || "/events",
      imageUrl: event.imageUrl || CITY_HERO_IMAGES[city.slug],
      venue: event.venueName || `${city.name} listing`,
      date: event.startAt,
      badge: "External listing",
    })),
  ].slice(0, 8);

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src={CITY_HERO_IMAGES[city.slug]}
            alt={`${city.name} events`}
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="ev-hero-overlay absolute inset-0" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
          <div className="ev-kicker">{city.stateLabel}</div>
          <h1 className="ev-title max-w-5xl">{city.headline}</h1>
          <p className="ev-subtitle max-w-2xl">{city.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/?city=${encodeURIComponent(city.name)}`} className="ev-button-primary">
              Search {city.name}
            </Link>
            <Link href="/events" className="ev-button-secondary">
              Browse all events
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-section-kicker">{modules.citySpotlight.eyebrow}</div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
          {modules.citySpotlight.headline}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">{modules.citySpotlight.body}</p>
        {cards.length ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((event) => (
              <Link key={event.id} href={event.href} className="group overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b10]">
                <div className="relative h-56">
                  <Image src={event.imageUrl} alt={event.title} fill unoptimized sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <span className="ev-chip ev-chip--external">{event.badge}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-2xl font-black tracking-tight text-white">{event.title}</h3>
                  <div className="mt-2 text-sm text-white/72">{event.venue}</div>
                  <div className="mt-1 text-sm text-white/55">
                    {event.date ? new Date(event.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date coming soon"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ev-empty mt-6">
            Search the wider EVNTSZN discovery layer to widen the field in {city.name}.
          </div>
        )}
      </section>

      {sponsorPlacements.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
          <SponsorPlacementStrip
            placements={sponsorPlacements}
            eyebrow={modules.sponsorBlock.eyebrow}
            headline={`${city.name} sponsors and partners`}
            body={modules.sponsorBlock.body}
            compact
          />
        </section>
      ) : null}
    </PublicPageFrame>
  );
}
