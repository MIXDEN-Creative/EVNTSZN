"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DiscoveryNativeEvent } from "@/lib/discovery";
import type { PublicVenueListing } from "@/lib/public-directory";
import type { HomepageContent, PublicModules } from "@/lib/site-content";
import type { TicketmasterEvent } from "@/lib/ticketmaster";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { getReserveOrigin } from "@/lib/domains";
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
  initialExternal: ExternalDiscoveryEvent[];
  reserveVenues: PublicVenueListing[];
  sponsorPlacements: SponsorPlacement[];
};

type ExternalDiscoveryEvent = {
  id: string;
  title: string;
  url: string | null;
  startAt: string | null;
  venueName: string | null;
  city?: string | null;
  state?: string | null;
  imageUrl: string | null;
  description: string | null;
  source: "ticketmaster" | "eventbrite";
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
  source: "evntszn" | "host" | "independent_organizer" | "ticketmaster" | "eventbrite";
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
  weather?: {
    summary?: string;
    venueNote?: string | null;
  } | null;
};

const FALLBACK_DISCOVERY_IMAGE =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80";

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

function compactSummary(value: string | null | undefined, fallback: string) {
  const source = (value || fallback).replace(/\s+/g, " ").trim();
  if (source.length <= 130) return source;
  return `${source.slice(0, 127).trimEnd()}...`;
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
      `${event.sourceLabel} worth showing up for.`,
    isPrimary: true,
    featured: event.featured,
  };
}

function normalizeExternalEvent(event: ExternalDiscoveryEvent): DiscoveryListing {
  return {
    id: event.id,
    title: event.title,
    href: event.url || "/events",
    imageUrl: event.imageUrl || FALLBACK_DISCOVERY_IMAGE,
    venue: event.venueName || "Venue to be announced",
    city: event.city || "",
    state: event.state || "",
    startAt: event.startAt,
    source: event.source,
    badgeLabel: event.source === "ticketmaster" ? "Ticketmaster" : "Eventbrite",
    summary:
      event.description ||
      `${event.venueName || "Live event"}${event.city ? ` · ${event.city}` : ""}`,
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
    case "eventbrite":
      return "ev-chip ev-chip--external";
  }
}

function getSourceLabel(source: DiscoveryListing["source"]) {
  switch (source) {
    case "evntszn":
      return "Official EVNTSZN";
    case "host":
      return "EVNTSZN Curator";
    case "independent_organizer":
      return "Partner";
    case "ticketmaster":
      return "Ticketmaster-backed";
    case "eventbrite":
      return "Eventbrite-backed";
  }
}

function createEmptyState(query: string, city: string) {
  if (query || city) {
    return {
      title: "No results for this search",
      body: `Try a different city or a broader search term. You can also jump into another city to see what people are turning up for right now.`,
    };
  }

  return {
    title: "Start your search",
    body: "Search for a city, artist, team, or nightlife vibe to see what is actually worth going to.",
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
    <article className="group overflow-hidden rounded-[32px] border border-white/10 bg-[#090910] shadow-[0_26px_72px_rgba(0,0,0,0.42)] transition duration-300 hover:-translate-y-1 hover:border-white/18">
      <Link href={event.href} className="block">
        <div className={`relative overflow-hidden ${priority === "hero" ? "h-[25rem] md:h-[30rem]" : "h-64 md:h-72"}`}>
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            unoptimized
            sizes={priority === "hero" ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-black/28 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className={getSourceChipClass(event.source)}>{getSourceLabel(event.source)}</span>
            {event.featured ? <span className="ev-chip ev-chip--featured">Featured</span> : null}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
              {event.city}
              {event.state ? `, ${event.state}` : ""}
            </div>
            <h3 className={`${priority === "hero" ? "max-w-2xl text-3xl md:text-5xl" : "text-2xl md:text-[2rem]"} mt-2 font-black leading-[0.94] tracking-[-0.05em] text-white`}>
              {event.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-5 md:p-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">Event details</div>
        <div className="mt-3 text-base font-semibold text-white/78">{event.venue}</div>
        <div className="mt-1 text-sm text-white/58">{formatEventDate(event.startAt)}</div>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/72">{event.summary}</p>
        <Link
          href={event.href}
          className="mt-6 ev-button-primary w-full"
        >
          Get Access
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
  reserveVenues,
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
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);

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
        setWeatherSummary(payload.weather?.summary || payload.weather?.venueNote || null);
        if (!nextResults.length) {
          setMessage(createEmptyState(nextQuery, nextCity).body);
        }
      } catch {
        setResults([]);
        setMessage("Search is taking a beat. Try again in a moment.");
        setWeatherSummary(null);
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
        setMessage("We could not access your location. Try Baltimore, Washington, Rehoboth Beach, Ocean City, or Bethany Beach.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const visibleResults = dedupeListings(results).slice(0, 8);
  const spotlight = visibleResults[0] || null;
  const rail = visibleResults.slice(spotlight ? 1 : 0);
  const emptyState = createEmptyState(query, city);
  const primaryInventory = useMemo(
    () =>
      dedupeListings([
        ...groupedNative.evntszn,
        ...groupedNative.host,
        ...groupedNative.independent,
      ]).slice(0, 6),
    [groupedNative],
  );
  const reserveSpotlight = reserveVenues.filter((venue) => venue.isReserveActive).slice(0, 4);
  const externalSpotlight = groupedNative.external.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 pt-[var(--public-page-top-space)]">
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

        <div className="relative mx-auto max-w-[1600px] px-4 py-14 md:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="ev-kicker">{content.hero.eyebrow}</div>
              <h1 className="ev-title max-w-5xl">
                {content.hero.title}
              </h1>
              <p className="ev-subtitle max-w-3xl">{content.hero.description}</p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/events" className="ev-button-primary px-10">
                  Find Events
                </Link>
                <Link href="/epl" className="ev-button-secondary px-10">
                  Prime League
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Tonight", value: "Find the move fast", detail: "Search what is happening now, what starts next, and what is worth getting dressed for." },
                  { label: "This weekend", value: "Big game and big-night energy", detail: "Concerts, sports, parties, and league nights across the cities people watch first." },
                  { label: "Across EVNTSZN", value: "One clean way in", detail: "Browse, buy, register, and keep up with EPL without getting dropped into disconnected pages." },
                ].map((stat) => (
                  <div key={stat.label} className="ev-feature-card bg-black/35">
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
              className="ev-section-frame"
            >
              <div className="ev-section-inner">
                <div className="ev-section-kicker">Find your next plan</div>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-[2.2rem]">
                  Search by city, artist, team, or nightlife mood. The strongest options surface first.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/72">
                  Discovery is curated to feel closer to a private city guide than a directory. EVNTSZN inventory leads, reserve stays nearby, and broader feeds support the search without flattening the experience.
                </p>

                <div className="mt-8 rounded-[28px] border border-white/10 bg-black/25 p-4 md:p-5">
                  <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
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
                      { key: "week", label: "This week" },
                      { key: "weekend", label: "Weekend" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        className={option.key === when ? "ev-toolbar-pill" : "ev-chip ev-chip--external"}
                        data-active={option.key === when}
                        onClick={() => {
                          setWhen(option.key as "" | "tonight" | "week" | "weekend");
                          void runSearch({ when: option.key as "" | "tonight" | "week" | "weekend" });
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button type="button" className="ev-chip ev-chip--external" onClick={useNearMe}>
                      Near me
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button type="button" className="ev-button-primary" onClick={() => void runSearch()}>
                      {loading ? "Searching..." : "Show the best options"}
                    </button>
                    <Link href="https://app.evntszn.com/account/register?next=/account" className="ev-button-secondary">
                      Create member account
                    </Link>
                  </div>
                </div>

                <div className="mt-4 text-sm leading-6 text-white/56">
                  Already have an account?{" "}
                  <Link href="https://app.evntszn.com/account/login" className="font-semibold text-white/80 transition hover:text-white">
                    Member sign in
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {content.visibility.showPopularSection ? (
        <section className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="ev-section-frame">
            <div className="ev-section-inner">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="ev-section-kicker">{hasSearched ? "Search Results" : "Trending Now"}</div>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl lg:text-6xl leading-[0.92]">
                  {hasSearched ? "The strongest matches are already in view." : "Start with what the city is already moving on."}
                </h2>
                <p className="mt-5 max-w-3xl text-base md:text-lg leading-7 text-white/68">
                  {content.discovery.body}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:max-w-[460px]">
                {[
                  ["Query", query.trim() || "Popular search"],
                  ["City", normalizedLocationLabel || city.trim() || "All cities"],
                  ["Timing", when || "Open"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="ev-utility-card bg-black/30">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[query.trim(), city.trim(), normalizedLocationLabel, weatherSummary]
                .filter(Boolean)
                .slice(0, 4)
                .map((value) => (
                  <div key={String(value)} className="ev-chip ev-chip--external">
                    {value}
                  </div>
                ))}
            </div>

            {loading ? (
              <div className="ev-empty-state mt-10 py-24">Loading fresh results...</div>
            ) : visibleResults.length === 0 ? (
              <div className="ev-empty-state mt-10 py-24">
                <div className="text-3xl font-black text-white tracking-tight">{emptyState.title}</div>
                <p className="mt-4 text-lg text-white/60 max-w-md">{message || emptyState.body}</p>
                <div className="mt-10 flex flex-wrap gap-3">
                  {PUBLIC_CITIES.map((suggestion) => (
                    <button
                      key={suggestion.slug}
                      type="button"
                      className="ev-chip ev-chip--external h-12 px-8 text-sm font-bold"
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
              <div className="mt-10 grid gap-8 lg:grid-cols-2 xl:grid-cols-[1.15fr_0.85fr]">
                {spotlight ? <DiscoveryCard event={spotlight} priority="hero" /> : null}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {rail.slice(0, 4).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
          <div className="ev-section-frame ev-section-frame--muted">
            <div className="ev-section-inner">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Primary discovery</div>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">Active EVNTSZN inventory leads the page.</h2>
              </div>
              <Link href="/events" className="ev-chip ev-chip--evntszn">
                Explore all events
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
              Official EVNTSZN drops, Curator-operated rooms, and Partner productions stay in the top lane. Broader discovery still helps fill the night, but it does not outrank native inventory.
            </p>
            <div className="mt-6 ev-card-grid ev-card-grid--tight">
              {primaryInventory.slice(0, 3).map((event) => (
                <Link key={event.id} href={event.href} className="ev-list-card transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={getSourceChipClass(event.source)}>{getSourceLabel(event.source)}</div>
                      <div className="mt-3 text-xl font-black tracking-tight text-white">{event.title}</div>
                    </div>
                    <div className="text-right text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                      {event.city}
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-white/72">{event.venue}</div>
                  <div className="mt-1 text-sm text-white/52">{formatEventDate(event.startAt)}</div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {compactSummary(event.summary, "EVNTSZN event discovery with city-ready detail.")}
                  </p>
                </Link>
              ))}
            </div>
            </div>
          </div>

          <div className="ev-section-frame ev-section-frame--muted">
            <div className="ev-section-inner">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Reserve tonight</div>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">Reservation and waitlist intent has its own lane.</h2>
              </div>
              <Link href={`${getReserveOrigin()}/`} className="ev-chip ev-chip--host">
                Open Reserve
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/68">
              Reserve stays premium, discreet, and conversion-ready. Guests can move into bookable venues or a city-level Reserve page without hitting a dead end when live venue data is thin.
            </p>
            <div className="mt-6 ev-card-grid ev-card-grid--tight">
              {reserveSpotlight.length ? reserveSpotlight.map((venue) => (
                <Link key={venue.slug} href={`${getReserveOrigin()}/${venue.slug}`} className="ev-list-card transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="ev-chip ev-chip--host">{venue.reserveSettings?.waitlist_enabled === false ? "Reservations only" : "Reservations + waitlist"}</div>
                      <div className="mt-3 text-xl font-black tracking-tight text-white">{venue.name}</div>
                    </div>
                    <div className="text-right text-[11px] font-bold uppercase tracking-[0.22em] text-white/42">
                      {venue.city}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {venue.cityProfile?.reservationsIntro || `${venue.name} is on EVNTSZN Reserve for nightlife tables, dining reservations, and waitlist flow.`}
                  </p>
                </Link>
              )) : PUBLIC_CITIES.slice(0, 3).map((cityItem) => (
                <Link key={cityItem.slug} href={`${getReserveOrigin()}/${cityItem.slug}`} className="ev-list-card transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="ev-chip ev-chip--host">Reserve by city</div>
                  <div className="mt-3 text-xl font-black tracking-tight text-white">{cityItem.shortLabel}</div>
                  <p className="mt-3 text-sm leading-6 text-white/62">{cityItem.reservationsIntro}</p>
                </Link>
              ))}
            </div>
            </div>
          </div>

          <div className="ev-section-frame ev-section-frame--muted">
            <div className="ev-section-inner">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Broader discovery</div>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">Secondary feeds support the search, not the brand.</h2>
              </div>
              <Link href="/city" className="ev-chip ev-chip--external">
                Explore cities
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/68">
              Ticketmaster and Eventbrite origin feeds give visitors a wider look at the city, while EVNTSZN stays the primary surface shaping what gets surfaced and where the user goes next.
            </p>
            <div className="mt-6 ev-card-grid ev-card-grid--tight">
              {externalSpotlight.map((event) => (
                <Link key={event.id} href={event.href} className="ev-list-card transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className={getSourceChipClass(event.source)}>{getSourceLabel(event.source)}</div>
                  <div className="mt-3 text-xl font-black tracking-tight text-white">{event.title}</div>
                  <div className="mt-2 text-sm font-semibold text-white/70">{event.venue}</div>
                  <div className="mt-1 text-sm text-white/52">{formatEventDate(event.startAt)}</div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {compactSummary(event.summary, "External discovery signal supporting the city search.")}
                  </p>
                </Link>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="ev-panel overflow-hidden p-8 md:p-10 lg:p-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="ev-section-kicker">Build on EVNTSZN</div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl lg:text-6xl leading-[0.95]">
                Choose the right lane before you build the event.
              </h2>
              <p className="mt-6 max-w-3xl text-lg md:text-xl leading-relaxed text-white/72">
                EVNTSZN Curators and Partners are not the same path. Curators operate inside the approved EVNTSZN network. Partners use EVNTSZN as a self-directed event platform with their own brand, audience, and operating lane.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/hosts/apply" className="ev-button-primary px-8">
                  Apply as a curator
                </Link>
                <Link href="/organizer/apply" className="ev-button-secondary px-8">
                  Apply as a partner
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-7 md:p-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A259FF]">EVNTSZN Curator</div>
                <div className="mt-4 text-2xl font-black text-white">Approved network lane.</div>
                <div className="mt-6 grid gap-4">
                  {[
                    "Operate inside the EVNTSZN Curator network and commission structure.",
                    "Best for approved city-facing operators who can run a room and hold the standard.",
                    "Current curator markets: Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-sm md:text-base leading-relaxed text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-7 md:p-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/42">Partner</div>
                <div className="mt-4 text-2xl font-black text-white">Self-operated event lane.</div>
                <div className="mt-6 grid gap-4">
                  {[
                    "Use EVNTSZN as your event platform without being treated as internal Curator network staff.",
                    "Best for your own events, audience, venue relationships, and operating model.",
                    "Crew Marketplace and EVNTSZN Link stay available without collapsing into the Curator path.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-sm md:text-base leading-relaxed text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {sponsorPlacements.length ? (
        <section className="mx-auto max-w-[1600px] px-4 pb-20 md:px-6 lg:px-8 lg:pb-28">
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
        <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6 lg:px-8 lg:pb-24">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="ev-section-kicker">Explore by lane</div>
              <h2 className="mt-4 text-5xl font-black tracking-[-0.04em] text-white md:text-6xl leading-[0.95]">
                Search by nightlife, music, sports, or city plans.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.taxonomy.categories.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => {
                  setQuery(category.title);
                  void runSearch({ query: category.title });
                }}
                className="rounded-[34px] border border-white/10 bg-white/5 group min-h-[220px] p-7 text-left transition-all hover:-translate-y-1 hover:bg-white/[0.08] hover:border-white/20"
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#cfb8ff]/60">
                  Explore
                </div>
                <div className="mt-5 text-3xl font-black tracking-tight text-white">{category.title}</div>
                <p className="mt-4 text-base leading-relaxed text-white/60">{category.description}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {content.visibility.showCityBlocks ? (
        <section id="cities" className="mx-auto max-w-[1600px] px-4 pb-20 md:px-6 lg:px-8 lg:pb-28">
          <div className="rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-16 lg:p-20">
            <div className="ev-section-kicker">Cities</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white md:text-6xl lg:text-7xl leading-[0.92]">
              Start with the city.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PUBLIC_CITIES.map((cityItem) => (
                <Link
                  key={cityItem.slug}
                  href={`/${cityItem.slug}`}
                  className="group flex flex-col rounded-[32px] border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.08] hover:shadow-2xl hover:border-white/20 hover:-translate-y-1"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#cfb8ff]/60">
                    {cityItem.stateLabel}
                  </div>
                  <div className="mt-5 text-3xl font-black tracking-tight text-white leading-none">{cityItem.shortLabel}</div>
                  <p className="mt-4 text-sm md:text-base leading-relaxed text-white/60 flex-1">{cityItem.description}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/90 group-hover:text-[#cfb8ff] transition-colors">
                    Explore city
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {content.visibility.showEplPanel ? (
        <section className="mx-auto max-w-[1600px] px-4 pb-20 md:px-6 lg:px-8 lg:pb-24">
          <div className="overflow-hidden rounded-[48px] border border-white/10 bg-[#0c0c15] shadow-[0_22px_60px_rgba(0,0,0,0.45)] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[480px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#0e0d17_0%,#08080d_100%)]" />
              <div className="relative flex h-full flex-col justify-center p-10 md:p-14 lg:p-16">
                <div className="ev-kicker text-[#b899ff]">EPL Season 1</div>
                <h2 className="mt-6 max-w-xl text-5xl font-black tracking-[-0.05em] text-white md:text-6xl lg:text-7xl leading-[0.9]">
                  Coed flag football.
                </h2>
                <p className="mt-8 max-w-xl text-lg md:text-xl leading-relaxed text-white/76">
                  EPL brings team identity, standings pressure, player registration, and game-day energy into one public league experience built to travel cleanly from city to city.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 md:max-w-xl">
                  {[
                    { name: "Canton Chargers", logo: "/epl_team_logos/chargers.jpeg" },
                    { name: "Federal Hill Sentinels", logo: "/epl_team_logos/sentinels.jpeg" },
                    { name: "Harbor Titans", logo: "/epl_team_logos/titans.jpeg" },
                    { name: "Dewey Warriors", logo: "/epl_team_logos/warriors.jpg" },
                    { name: "Fenwick Phantoms", logo: "/epl_team_logos/phantoms.PNG" },
                    { name: "Rehoboth Knights", logo: "/epl_team_logos/knights.jpg" },
                  ].map((team) => (
                    <div key={team.name} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-center">
                      <Image src={team.logo} alt={team.name} width={56} height={56} className="mx-auto h-14 w-14 rounded-2xl border border-white/10 object-cover" />
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                        {team.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href="https://epl.evntszn.com" className="ev-button-primary px-8">
                    Explore EPL
                  </Link>
                  <Link href="https://epl.evntszn.com/season-1/register" className="ev-button-secondary px-8">
                    Register
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-10 md:p-14 lg:p-16 bg-white/[0.01]">
              {[
                "A coed flag football league with real clubs, real standings, and real regional pride.",
                "Two draft nights shape the player pool: Baltimore first, then the coastal region one week later.",
                "Supporters can move from team pages to standings to opportunities without losing the league thread.",
              ].map((item) => (
                <div key={item} className="rounded-[32px] border border-white/10 bg-white/[0.02] p-8 flex flex-col justify-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#cfb8ff]/60">Why EPL lands</div>
                  <div className="mt-5 text-xl md:text-2xl font-black leading-tight text-white">{item}</div>
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
        <section className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6 lg:px-8">
          <div className="ev-section-kicker">More discovery</div>
          <div className="mt-10 space-y-16">
            {content.visibility.showNativeSection && groupedNative.evntszn.length > 0 ? (
              <div>
                <h2 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">{content.discovery.nativeHeadline}</h2>
                <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedNative.evntszn.slice(0, 4).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showHostSection && groupedNative.host.length > 0 ? (
              <div>
                <h2 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">{content.discovery.hostHeadline}</h2>
                <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedNative.host.slice(0, 4).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showIndependentSection && groupedNative.independent.length > 0 ? (
              <div>
                <h2 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">{content.discovery.independentHeadline}</h2>
                <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedNative.independent.slice(0, 4).map((event) => (
                    <DiscoveryCard key={event.id} event={event} priority="rail" />
                  ))}
                </div>
              </div>
            ) : null}
            {content.visibility.showExternalSection && groupedNative.external.length > 0 ? (
              <div>
                <h2 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">{content.discovery.externalHeadline}</h2>
                <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedNative.external.slice(0, 4).map((event) => (
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
