"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscoveryNativeEvent } from "@/lib/discovery";
import type { HomepageContent, PublicModules } from "@/lib/site-content";
import type { TicketmasterEvent } from "@/lib/ticketmaster";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import type { SponsorPlacement } from "@/lib/sponsor-placements";
import SponsorPlacementStrip from "@/components/public/SponsorPlacementStrip";

type DiscoveryLandingProps = {
  content: HomepageContent;
  modules: PublicModules;
  initialPopular: DiscoveryListing[];
  initialNativeSections: {
    evntszn: DiscoveryNativeEvent[];
    host: DiscoveryNativeEvent[];
    independent_organizer: DiscoveryNativeEvent[];
  };
  initialExternal: TicketmasterEvent[];
  sponsorPlacements: SponsorPlacement[];
};

type DiscoveryListing = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  venue: string;
  city: string;
  state: string;
  startAt: string | null;
  source: "evntszn" | "host" | "independent_organizer" | "ticketmaster";
  badgeLabel: string;
  summary: string;
  isPrimary: boolean;
  featured?: boolean;
};

type DiscoveryResponse = {
  ok?: boolean;
  native?: DiscoveryNativeEvent[];
  external?: TicketmasterEvent[];
  results?: DiscoveryListing[];
  normalizedCity?: {
    city?: string;
    state?: string;
    label?: string;
  } | null;
};

const FALLBACK_DISCOVERY_IMAGE =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80";
const FALLBACK_EPL_IMAGE =
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1800&q=80";

function formatEventDate(value: string | null | undefined) {
  if (!value) return "Date coming soon";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date coming soon";

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeNativeEvent(event: DiscoveryNativeEvent): DiscoveryListing {
  return {
    id: event.id,
    title: event.title,
    href: event.href,
    imageUrl: event.imageUrl || FALLBACK_DISCOVERY_IMAGE,
    venue: event.subtitle || event.heroNote || "EVNTSZN listing",
    city: event.city,
    state: event.state,
    startAt: event.startAt,
    source: event.source,
    badgeLabel: event.badgeLabel,
    summary:
      event.description ||
      event.heroNote ||
      `${event.sourceLabel} shaping the city calendar.`,
    isPrimary: true,
    featured: event.featured,
  };
}

function normalizeExternalEvent(event: TicketmasterEvent): DiscoveryListing {
  return {
    id: event.id,
    title: event.title,
    href: event.url || "/events",
    imageUrl: event.imageUrl || FALLBACK_DISCOVERY_IMAGE,
    venue: event.venueName || "Venue to be announced",
    city: event.city || "",
    state: event.state || "",
    startAt: event.startAt,
    source: "ticketmaster",
    badgeLabel: "External listing",
    summary:
      event.description ||
      `${event.venueName || "Live city listing"}${event.city ? ` · ${event.city}` : ""}`,
    isPrimary: false,
  };
}

function dedupeListings(items: DiscoveryListing[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.title, item.city, item.state, item.startAt?.slice(0, 10) || "unknown"]
      .join("|")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSourceChipClass(source: DiscoveryListing["source"]) {
  switch (source) {
    case "evntszn":
      return "ev-chip ev-chip--evntszn";
    case "host":
      return "ev-chip ev-chip--host";
    case "independent_organizer":
      return "ev-chip ev-chip--independent";
    case "ticketmaster":
      return "ev-chip ev-chip--external";
  }
}

function getSourceLabel(source: DiscoveryListing["source"]) {
  switch (source) {
    case "evntszn":
      return "Official EVNTSZN";
    case "host":
      return "EVNTSZN Host";
    case "independent_organizer":
      return "Independent Organizer";
    case "ticketmaster":
      return "Ticketmaster-backed";
  }
}

function createEmptyState(query: string, city: string) {
  if (query || city) {
    return {
      title: "No strong matches yet.",
      body: `Try a broader search, switch cities, or jump into Baltimore, Atlanta, New York, Miami, or DC to widen the field.`,
    };
  }

  return {
    title: "Discovery is warming up.",
    body: "Search a city, artist, venue, or nightlife mood to pull live results into the rail below.",
  };
}

function DiscoveryCard({
  event,
  priority,
}: {
  event: DiscoveryListing;
  priority: "hero" | "rail";
}) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#090910] shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
      <Link href={event.href} className="block">
        <div className={`relative overflow-hidden ${priority === "hero" ? "h-72" : "h-64"}`}>
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            unoptimized
            sizes={priority === "hero" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className={getSourceChipClass(event.source)}>{getSourceLabel(event.source)}</span>
            {event.featured ? <span className="ev-chip ev-chip--featured">Featured</span> : null}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
              {event.city}
              {event.state ? `, ${event.state}` : ""}
            </div>
            <h3 className={`${priority === "hero" ? "text-3xl md:text-4xl" : "text-2xl"} mt-2 font-black leading-tight tracking-[-0.04em] text-white`}>
              {event.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="text-sm font-semibold text-white/78">{event.venue}</div>
        <div className="mt-1 text-sm text-white/58">{formatEventDate(event.startAt)}</div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/72">{event.summary}</p>
        <Link
          href={event.href}
          className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          View event
        </Link>
      </div>
    </article>
  );
}

export default function DiscoveryLanding({
  content,
  modules,
  initialPopular,
  initialNativeSections,
  initialExternal,
  sponsorPlacements,
}: DiscoveryLandingProps) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [when, setWhen] = useState<"" | "tonight" | "week" | "weekend">("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoveryListing[]>(initialPopular);
  const [normalizedLocationLabel, setNormalizedLocationLabel] = useState<string | null>(null);

  const groupedNative = useMemo(
    () => ({
      evntszn: initialNativeSections.evntszn.map(normalizeNativeEvent),
      host: initialNativeSections.host.map(normalizeNativeEvent),
      independent: initialNativeSections.independent_organizer.map(normalizeNativeEvent),
      external: initialExternal.map(normalizeExternalEvent),
    }),
    [initialExternal, initialNativeSections],
  );

  const runSearch = useCallback(
    async (next?: {
      query?: string;
      city?: string;
      when?: "" | "tonight" | "week" | "weekend";
      lat?: number;
      lng?: number;
    }) => {
      const nextQuery = next?.query ?? query;
      const nextCity = next?.city ?? city;
      const nextWhen = next?.when ?? when;

      setLoading(true);
      setHasSearched(true);
      setMessage(null);

      try {
        const params = new URLSearchParams();
        if (nextQuery.trim()) params.set("q", nextQuery.trim());
        if (nextCity.trim()) params.set("city", nextCity.trim());
        if (nextWhen) params.set("when", nextWhen);
        if (typeof next?.lat === "number" && typeof next?.lng === "number") {
          params.set("lat", String(next.lat));
          params.set("lng", String(next.lng));
        }

        const response = await fetch(`/api/discovery/search?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as DiscoveryResponse;

        const nextResults =
          payload.results ||
          [
            ...((payload.native || []).map(normalizeNativeEvent)),
            ...((payload.external || []).map(normalizeExternalEvent)),
          ];

        setResults(nextResults);
        setNormalizedLocationLabel(payload.normalizedCity?.label || null);
        if (!nextResults.length) {
          setMessage(createEmptyState(nextQuery, nextCity).body);
        }
      } catch {
        setResults([]);
        setMessage("Search is taking a beat. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    },
    [city, query, when],
  );

  useEffect(() => {
    if (!query.trim() && !city.trim()) return;
    const timeout = window.setTimeout(() => {
      void runSearch();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, city, when, runSearch]);

  async function useNearMe() {
    if (!navigator.geolocation) {
      setHasSearched(true);
      setMessage("Location is not available on this device. Try a city instead.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoading(false);
        await runSearch({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLoading(false);
        setHasSearched(true);
        setMessage("We could not access your location. Try Baltimore, Atlanta, New York, Miami, or DC.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const visibleResults = dedupeListings(results).slice(0, 8);
  const spotlight = visibleResults[0] || null;
  const rail = visibleResults.slice(spotlight ? 1 : 0);
  const emptyState = createEmptyState(query, city);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src={
              spotlight?.imageUrl ||
              FALLBACK_DISCOVERY_IMAGE
            }
            alt="EVNTSZN discovery hero"
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="ev-hero-overlay absolute inset-0" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="ev-kicker">{content.hero.eyebrow}</div>
              <h1 className="ev-title max-w-5xl">
                {content.hero.title}
              </h1>
              <p className="ev-subtitle max-w-2xl">{content.hero.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={content.hero.primaryCtaHref} className="ev-button-primary">
                  {content.hero.primaryCtaLabel}
                </Link>
                <Link href={content.hero.secondaryCtaHref} className="ev-button-secondary">
                  {content.hero.secondaryCtaLabel}
                </Link>
                <Link href={content.hero.tertiaryCtaHref} className="ev-button-secondary">
                  {content.hero.tertiaryCtaLabel}
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Tonight", value: "Live now", detail: "Nightlife, last-minute plans, and artist nights worth moving on." },
                  { label: "This weekend", value: "Big city energy", detail: "Concerts, sports, parties, and headline plans across your market." },
                  { label: "Member value", value: "Tickets and access", detail: "Discovery, account, checkout, and league surfaces connected cleanly." },
                ].map((stat) => (
                  <div key={stat.label} className="ev-meta-card bg-black/35">
                    <div className="ev-meta-label">{stat.label}</div>
                    <div className="mt-3 text-2xl font-black tracking-tight text-white">{stat.value}</div>
                    <div className="mt-2 text-sm leading-6 text-white/70">{stat.detail}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.06 }}
              className="ev-panel p-6 md:p-7"
            >
              <div className="ev-section-kicker">Explore what is moving</div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
                Search the city fast, then move straight into the best listings.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/72">
                Search nightlife, concerts, sports, and things to do. Results land immediately below this bar so people can move from curiosity to action without friction.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-[1.1fr_0.8fr]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={content.discovery.searchPlaceholder}
                  className="ev-field"
                />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={content.discovery.cityPlaceholder}
                  className="ev-field"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: "", label: "Popular" },
                  { key: "tonight", label: "Tonight" },
                  { key: "week", label: "This Week" },
                  { key: "weekend", label: "This Weekend" },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={option.key === when ? "ev-chip ev-chip--host" : "ev-chip ev-chip--external"}
                    onClick={() => {
                      setWhen(option.key as "" | "tonight" | "week" | "weekend");
                      void runSearch({ when: option.key as "" | "tonight" | "week" | "weekend" });
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                <button type="button" className="ev-chip ev-chip--external" onClick={useNearMe}>
                  Near Me
                </button>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <button type="button" className="ev-button-primary" onClick={() => void runSearch()}>
                  {loading ? "Searching..." : "Search EVNTSZN"}
                </button>
                <Link href="https://app.evntszn.com/account/login" className="ev-button-secondary">
                  Sign In
                </Link>
                <Link href="https://app.evntszn.com/account/login?mode=signup&next=/account" className="ev-button-secondary">
                  Create Account
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {content.visibility.showPopularSection ? (
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="ev-section-kicker">{hasSearched ? "Matching results" : "Popular right now"}</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
              {hasSearched ? "Results that actually match what you asked for." : "The strongest plans in the city, surfaced first."}
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/72">
              {content.discovery.body}
            </p>
          </div>
          <div className="max-w-md text-sm leading-6 text-white/55">
            {message || (normalizedLocationLabel ? `Using ${normalizedLocationLabel} for the strongest city match.` : content.discovery.disclosure)}
          </div>
        </div>

        {loading ? (
          <div className="ev-empty mt-8">Loading fresh results...</div>
        ) : visibleResults.length === 0 ? (
          <div className="ev-empty mt-8">
            <div className="text-xl font-bold text-white">{emptyState.title}</div>
            <p className="mt-2 text-sm leading-6 text-white/70">{message || emptyState.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PUBLIC_CITIES.map((suggestion) => (
                <button
                  key={suggestion.slug}
                  type="button"
                  className="ev-chip ev-chip--external"
                  onClick={() => {
                    setCity(suggestion.name);
                    void runSearch({ city: suggestion.name });
                  }}
                >
                  Try {suggestion.shortLabel}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            {spotlight ? <DiscoveryCard event={spotlight} priority="hero" /> : null}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
              {rail.slice(0, 4).map((event) => (
                <DiscoveryCard key={event.id} event={event} priority="rail" />
              ))}
            </div>
          </div>
        )}
      </section>
      ) : null}

      {sponsorPlacements.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
          <SponsorPlacementStrip
            placements={sponsorPlacements}
            eyebrow={modules.sponsorBlock.eyebrow}
            headline={modules.sponsorBlock.headline}
            body={modules.sponsorBlock.body}
            compact
          />
        </section>
      ) : null}

      {content.visibility.showCategoryBlocks ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Explore by lane</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                Search by nightlife, music, sports, or city plans.
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {content.taxonomy.categories.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => {
                  setQuery(category.title);
                  void runSearch({ query: category.title });
                }}
                className="ev-panel p-5 text-left hover:-translate-y-0.5"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cfb8ff]">
                  Explore
                </div>
                <div className="mt-3 text-2xl font-black tracking-tight text-white">{category.title}</div>
                <p className="mt-3 text-sm leading-6 text-white/72">{category.description}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {content.visibility.showCityBlocks ? (
        <section id="cities" className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
          <div className="ev-panel p-6 md:p-8">
            <div className="ev-section-kicker">Cities</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              Start with the city. The right night follows.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {PUBLIC_CITIES.map((cityItem) => (
                <Link
                  key={cityItem.slug}
                  href={`/${cityItem.slug}`}
                  className="group rounded-[24px] border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cfb8ff]">
                    {cityItem.stateLabel}
                  </div>
                  <div className="mt-3 text-2xl font-black tracking-tight text-white">{cityItem.shortLabel}</div>
                  <p className="mt-3 text-sm leading-6 text-white/70">{cityItem.description}</p>
                  <span className="mt-5 inline-flex text-sm font-semibold text-white/84">Explore {cityItem.shortLabel}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {content.visibility.showEplPanel ? (
        <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0c15] shadow-[0_22px_60px_rgba(0,0,0,0.45)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[360px]">
              <Image
                src={FALLBACK_EPL_IMAGE}
                alt="EVNTSZN Prime League"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/15" />
              <div className="relative p-6 md:p-8">
                <div className="ev-kicker">EPL Season 1</div>
                <h2 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                  Baltimore draft night, coed competition, and a league surface built to feel worth following.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/76">
                  EPL gives EVNTSZN a flagship sports-entertainment vertical with registration pull, team identity, standings pressure, and a draft countdown anchored to Saturday, June 6.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="https://epl.evntszn.com" className="ev-button-primary">
                    Explore EPL
                  </Link>
                  <Link href="https://epl.evntszn.com/season-1/register" className="ev-button-secondary">
                    Register
                  </Link>
                  <Link href="https://epl.evntszn.com#schedule" className="ev-button-secondary">
                    View Schedule
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-6 md:p-8">
              {[
                "City-rooted coed competition with real team identity.",
                "Draft-night countdown and public league rhythm instead of a dead registration page.",
                "A sports vertical that belongs inside the same premium EVNTSZN world as nightlife and live events.",
              ].map((item) => (
                <div key={item} className="ev-panel p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cfb8ff]">Why EPL lands</div>
                  <div className="mt-3 text-lg font-semibold leading-7 text-white">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {(content.visibility.showNativeSection && groupedNative.evntszn.length > 0) ||
      (content.visibility.showHostSection && groupedNative.host.length > 0) ||
      (content.visibility.showIndependentSection && groupedNative.independent.length > 0) ||
      (content.visibility.showExternalSection && groupedNative.external.length > 0) ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 lg:px-8">
          <div className="ev-section-kicker">More discovery</div>
          <div className="mt-3 space-y-10">
            {content.visibility.showNativeSection && groupedNative.evntszn.length > 0 ? (
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] text-white">{content.discovery.nativeHeadline}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {groupedNative.evntszn.slice(0, 3).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showHostSection && groupedNative.host.length > 0 ? (
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] text-white">{content.discovery.hostHeadline}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {groupedNative.host.slice(0, 3).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showIndependentSection && groupedNative.independent.length > 0 ? (
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] text-white">{content.discovery.independentHeadline}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {groupedNative.independent.slice(0, 3).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showExternalSection && groupedNative.external.length > 0 ? (
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] text-white">{content.discovery.externalHeadline}</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {groupedNative.external.slice(0, 3).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
