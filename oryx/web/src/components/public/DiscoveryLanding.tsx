"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import FadeIn from "@/components/motion/FadeIn";
import type { DiscoveryNativeEvent } from "@/lib/discovery";
import { getDiscoveryFallbackImage } from "@/lib/discovery";
import type {
  HomepageBannerContent,
  HomepageDiscoveryContent,
  HomepageHeroContent,
  HomepageTaxonomyContent,
  HomepageVisibilityContent,
} from "@/lib/site-content";
import type { TicketmasterEvent } from "@/lib/ticketmaster";

type DiscoveryResponse = {
  ok?: boolean;
  storageReady?: boolean;
  native?: DiscoveryNativeEvent[];
  external?: Array<TicketmasterEvent & { isPrimary: false }>;
  error?: string;
};

type NativeGroups = {
  evntszn: DiscoveryNativeEvent[];
  host: DiscoveryNativeEvent[];
  independent_organizer: DiscoveryNativeEvent[];
};

type SearchWindow = "all" | "tonight" | "week" | "weekend";

type DiscoveryResultCard =
  | {
      id: string;
      kind: "native";
      title: string;
      subtitle: string;
      href: string;
      imageUrl: string;
      chip: string;
      chipClass: string;
      secondaryChip?: string | null;
      ctaLabel: string;
      meta: string;
      body: string;
    }
  | {
      id: string;
      kind: "external";
      title: string;
      subtitle: string;
      href: string | null;
      imageUrl: string;
      chip: string;
      secondaryChip?: string | null;
      ctaLabel: string;
      meta: string;
      body: string;
    };

function formatSchedule(value: string | null | undefined) {
  if (!value) return "Schedule pending";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupBySource(events: DiscoveryNativeEvent[]): NativeGroups {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent_organizer: events.filter((event) => event.source === "independent_organizer"),
  };
}

function getSourceChipClass(source: DiscoveryNativeEvent["source"]) {
  if (source === "evntszn") return "ev-chip ev-chip--evntszn";
  if (source === "host") return "ev-chip ev-chip--host";
  return "ev-chip ev-chip--independent";
}

function getExternalFallbackImage(city?: string | null) {
  return getDiscoveryFallbackImage(city || "Baltimore", "host");
}

function getSearchWindowLabel(value: SearchWindow) {
  switch (value) {
    case "tonight":
      return "Tonight";
    case "week":
      return "This Week";
    case "weekend":
      return "This Weekend";
    case "all":
    default:
      return "All";
  }
}

function EventDiscoveryCard({ item }: { item: DiscoveryResultCard }) {
  const content = (
    <article className="ev-panel ev-metal-border group relative overflow-hidden p-0">
      <div className="relative h-56 overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
          <span className={item.kind === "native" ? item.chipClass : "ev-chip ev-chip--external"}>{item.chip}</span>
          {item.secondaryChip ? <span className="ev-chip">{item.secondaryChip}</span> : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-white/70">{item.subtitle}</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">{item.title}</h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm text-white/62">{item.meta}</p>
        <p className="mt-4 text-white/76">{item.body}</p>
        <div className="ev-button-primary mt-6 inline-flex">{item.ctaLabel}</div>
      </div>
    </article>
  );

  if (!item.href) {
    return content;
  }

  if (item.kind === "external") {
    return (
      <a href={item.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={item.href}>{content}</Link>;
}

export default function DiscoveryLanding({
  hero,
  banner,
  discovery,
  taxonomy,
  visibility,
  groupedNativeEvents,
  externalShowcase,
  heroImage,
}: {
  hero: HomepageHeroContent;
  banner: HomepageBannerContent;
  discovery: HomepageDiscoveryContent;
  taxonomy: HomepageTaxonomyContent;
  visibility: HomepageVisibilityContent;
  groupedNativeEvents: NativeGroups;
  externalShowcase: TicketmasterEvent[];
  heroImage: string | null;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [windowFilter, setWindowFilter] = useState<SearchWindow>("all");
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationState, setLocationState] = useState<"idle" | "pending" | "granted" | "denied">("idle");
  const [message, setMessage] = useState("");

  async function runSearch(overrides?: {
    when?: SearchWindow;
    latitude?: number;
    longitude?: number;
    query?: string;
    city?: string;
  }) {
    const nextFilter = overrides?.when ?? windowFilter;
    const nextQuery = overrides?.query ?? query;
    const nextCity = overrides?.city ?? city;
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      if (nextCity.trim()) params.set("city", nextCity.trim());
      if (nextFilter !== "all") params.set("when", nextFilter);
      if (typeof overrides?.latitude === "number" && typeof overrides?.longitude === "number") {
        params.set("lat", String(overrides.latitude));
        params.set("lng", String(overrides.longitude));
      }

      const response = await fetch(`/api/discovery/search?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as DiscoveryResponse;

      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "Could not load discovery results.");
      }

      setResults(payload);
    } catch (error) {
      setResults({ ok: false, native: [], external: [] });
      setMessage(error instanceof Error ? error.message : "Could not load discovery results.");
    } finally {
      setLoading(false);
    }
  }

  function runPresetSearch(next: { query?: string; city?: string; when?: SearchWindow }) {
    if (typeof next.query === "string") setQuery(next.query);
    if (typeof next.city === "string") setCity(next.city);
    if (typeof next.when === "string") setWindowFilter(next.when);
    void runSearch(next);
  }

  function useNearMe() {
    if (!navigator.geolocation) {
      setLocationState("denied");
      setMessage("Location services are unavailable on this device. Search by city instead.");
      return;
    }

    setLocationState("pending");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState("granted");
        void runSearch({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationState("denied");
        setMessage("Location access was denied. Search by city, tonight, or this weekend instead.");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      },
    );
  }

  const activeGroups = useMemo(() => {
    if (results?.native) {
      return groupBySource(results.native);
    }
    return groupedNativeEvents;
  }, [groupedNativeEvents, results?.native]);

  const externalResults = results?.external?.length ? results.external : externalShowcase;
  const hasSearchContext =
    Boolean(query.trim()) ||
    Boolean(city.trim()) ||
    windowFilter !== "all" ||
    locationState === "granted";
  const heroBackdrop = heroImage || getDiscoveryFallbackImage("Baltimore", "evntszn");

  const topResults = useMemo<DiscoveryResultCard[]>(() => {
    const native = (results?.native || [])
      .slice(0, 6)
      .map<DiscoveryResultCard>((event) => ({
        id: event.id,
        kind: "native",
        title: event.title,
        subtitle: event.sourceLabel,
        href: event.href,
        imageUrl: event.imageUrl || getDiscoveryFallbackImage(event.city, event.source),
        chip: event.badgeLabel,
        chipClass: getSourceChipClass(event.source),
        secondaryChip: event.featured ? "Featured" : event.promoCollection,
        ctaLabel: "Open event",
        meta: `${event.city}, ${event.state} · ${formatSchedule(event.startAt)}`,
        body:
          event.subtitle ||
          event.heroNote ||
          event.description ||
          "A premium live moment built for sharp presentation, city energy, and clean execution.",
      }));

    const external = externalResults.slice(0, 6).map<DiscoveryResultCard>((event) => ({
      id: event.id,
      kind: "external",
      title: event.title,
      subtitle: event.venueName || "External discovery",
      href: event.url,
      imageUrl: event.imageUrl || getExternalFallbackImage(event.city),
      chip: "External listing",
      secondaryChip: "Ticketmaster",
      ctaLabel: "View listing",
      meta: `${event.city || "City"}${event.state ? `, ${event.state}` : ""} · ${formatSchedule(event.startAt)}`,
      body: "Broader city coverage for nights when you want more than the usual feed without losing the premium EVNTSZN frame.",
    }));

    return [...native, ...external];
  }, [externalResults, results?.native]);

  const sourceSections: Array<{
    key: keyof NativeGroups;
    title: string;
    eyebrow: string;
    enabled: boolean;
    events: DiscoveryNativeEvent[];
  }> = [
    {
      key: "evntszn",
      title: discovery.nativeHeadline,
      eyebrow: "Official EVNTSZN",
      enabled: visibility.showNativeSection,
      events: activeGroups.evntszn,
    },
    {
      key: "host",
      title: discovery.hostHeadline,
      eyebrow: "Hosted inside EVNTSZN",
      enabled: visibility.showHostSection,
      events: activeGroups.host,
    },
    {
      key: "independent_organizer",
      title: discovery.independentHeadline,
      eyebrow: "Independent organizers",
      enabled: visibility.showIndependentSection,
      events: activeGroups.independent_organizer,
    },
  ].filter((section): section is {
    key: keyof NativeGroups;
    title: string;
    eyebrow: string;
    enabled: boolean;
    events: DiscoveryNativeEvent[];
  } => section.enabled && section.events.length > 0);

  const popularCards = topResults.slice(0, 6);

  return (
    <div className="ev-shell">
      <section className="relative overflow-hidden rounded-[36px] ev-panel ev-metal-border min-h-[76vh]">
        <div className="absolute inset-0">
          <Image
            src={heroBackdrop}
            alt="EVNTSZN public event discovery"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 ev-hero-overlay" />
          <div className="absolute inset-0 ev-subtle-grid opacity-25" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(162,89,255,0.26),transparent_28%)]" />
        </div>

        <div className="relative z-10 flex min-h-[76vh] items-end px-6 py-8 md:px-10 lg:px-14">
          <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-4xl">
              <FadeIn delay={0.05}>
                <div className="mb-4 inline-flex ev-chip text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                  {hero.eyebrow}
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="ev-headline max-w-5xl text-5xl font-black text-white md:text-6xl lg:text-7xl">
                  {hero.title}
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-5 max-w-3xl text-base text-white/82 md:text-lg">
                  {hero.description}
                </p>
              </FadeIn>
              <FadeIn delay={0.22} className="mt-8 flex flex-wrap gap-3">
                <Link href={hero.primaryCtaHref} className="ev-button-primary">
                  {hero.primaryCtaLabel}
                </Link>
                <Link href={hero.secondaryCtaHref} className="ev-button-secondary">
                  {hero.secondaryCtaLabel}
                </Link>
                <Link href={hero.tertiaryCtaHref} className="ev-button-secondary">
                  {hero.tertiaryCtaLabel}
                </Link>
              </FadeIn>
            </div>

            <FadeIn delay={0.28}>
              <div className="ev-glass rounded-[28px] p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                  What people are chasing
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    {
                      label: "Tonight",
                      value: "High-intent energy",
                      detail: "Nightlife, artist drops, headline moments, and last-minute city plans.",
                    },
                    {
                      label: "This weekend",
                      value: "Best-of-city planning",
                      detail: "Big-room concerts, sports entertainment, and premium live-event choices.",
                    },
                    {
                      label: "Near me",
                      value: "Location-first search",
                      detail: "Pull the best nearby options fast without burying the strongest EVNTSZN signals.",
                    },
                    {
                      label: "Members",
                      value: "Tickets, rewards, access",
                      detail: "Keep discovery and account actions connected from the first click.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">{item.label}</div>
                      <div className="mt-3 text-xl font-bold leading-tight">{item.value}</div>
                      <div className="mt-2 text-sm text-white/66">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="mt-8 ev-panel ev-metal-border">
        <div className="ev-section-kicker">{banner.eyebrow}</div>
        <div className="mt-4 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <div>
            <h2 className="ev-panel-title">{banner.title}</h2>
            <p className="ev-panel-copy mt-3">{banner.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["all", "tonight", "week", "weekend"] as SearchWindow[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === windowFilter ? "ev-button-primary" : "ev-button-secondary"}
                  onClick={() => {
                    setWindowFilter(value);
                    void runSearch({ when: value });
                  }}
                >
                  {getSearchWindowLabel(value)}
                </button>
              ))}
              <button
                type="button"
                className={locationState === "granted" ? "ev-button-primary" : "ev-button-secondary"}
                onClick={useNearMe}
              >
                {locationState === "pending" ? "Locating..." : "Near Me"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
              <input
                className="ev-field"
                placeholder={discovery.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void runSearch();
                  }
                }}
              />
              <input
                className="ev-field"
                placeholder={discovery.cityPlaceholder}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void runSearch();
                  }
                }}
              />
              <button type="button" className="ev-button-primary" onClick={() => void runSearch()}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/account/login?mode=signup&next=/account" className="ev-button-secondary">
                Create attendee account
              </Link>
              <Link href="/account/login?next=/account" className="ev-button-secondary">
                Existing member login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="ev-kicker">{hasSearchContext ? "Matching results" : "Popular right now"}</div>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {hasSearchContext ? "Results land here immediately." : "Start with what feels alive right now."}
              </h3>
            </div>
            <div className="text-sm text-white/56">
              {hasSearchContext
                ? `${(results?.native?.length || 0) + (results?.external?.length || 0)} results`
                : "Trending concerts, nightlife, sports, and city moments"}
            </div>
          </div>

          {message ? (
            <div className="ev-empty mt-4">{message}</div>
          ) : null}

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {popularCards.length > 0 ? (
              popularCards.map((item, index) => (
                <FadeIn key={item.id} delay={0.04 * index}>
                  <EventDiscoveryCard item={item} />
                </FadeIn>
              ))
            ) : (
              <div className="ev-empty xl:col-span-3">
                No events matched this search yet. Try a different city, a broader keyword, or switch from tonight to this weekend.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="ev-kicker">Explore the city</div>
            <h2 className="ev-panel-title mt-2">Popular nights, headline moments, and the best reasons to go out.</h2>
          </div>
          <Link href="/events" className="text-sm font-medium text-[#d6c5ff] transition hover:text-white">
            Browse all events
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Best of tonight",
                  description: "Fast-moving picks for right-now plans, late decisions, and city energy that still has room.",
                  onClick: () => runPresetSearch({ when: "tonight" }),
                },
                {
                  title: "This weekend",
                  description: "The strongest concerts, nightlife, sports, and live entertainment stacked in one polished lane.",
                  onClick: () => runPresetSearch({ when: "weekend" }),
                },
                {
                  title: "City favorites",
                  description: "Baltimore, Atlanta, Miami, and New York discovery intent shaped for real event demand.",
                  onClick: () => runPresetSearch({ city: "Baltimore" }),
                },
                {
                  title: "Member-ready moves",
                  description: "Discover, save the move, grab the ticket, and keep your EVNTSZN account connected to the experience.",
                  onClick: () => runPresetSearch({ query: "live entertainment" }),
                },
              ].map((item, index) => (
                <FadeIn key={item.title} delay={0.04 * index}>
                  <button type="button" onClick={item.onClick} className="ev-panel ev-metal-border text-left transition hover:bg-white/[0.05]">
                    <div className="ev-section-kicker">Explore</div>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-white/72">{item.description}</p>
                  </button>
                </FadeIn>
              ))}
        </div>
      </section>

      {visibility.showEplPanel ? (
        <section className="mt-8 ev-panel ev-metal-border overflow-hidden">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div>
              <div className="ev-section-kicker">EPL spotlight</div>
              <h2 className="ev-panel-title mt-3">The league vertical that gives EVNTSZN real sports-entertainment gravity.</h2>
              <p className="ev-panel-copy mt-3">
                EPL turns registration, draft night, team identity, and city-level competition into a public-facing league experience that feels organized, premium, and worth following.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/epl" className="ev-button-primary">
                  Explore EPL
                </Link>
                <Link href="/epl/season-1/register" className="ev-button-secondary">
                  Register
                </Link>
                <Link href="/epl#schedule" className="ev-button-secondary">
                  View Schedule
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="ev-meta-card">
                <div className="ev-meta-label">Competition</div>
                <div className="ev-meta-value">Coed league structure with player review, draft eligibility, and real team identity.</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Moment</div>
                <div className="ev-meta-value">Draft-night presentation, standings movement, and city-level energy built into the season flow.</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Presentation</div>
                <div className="ev-meta-value">Public league pages, merch, registration, and operations all held to the EVNTSZN premium standard.</div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {visibility.showCategoryBlocks ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {taxonomy.categories.map((category, index) => (
            <FadeIn key={category.title} delay={0.04 * index}>
              <button
                type="button"
                onClick={() => runPresetSearch({ query: category.title.toLowerCase() })}
                className="ev-panel ev-metal-border text-left transition hover:bg-white/[0.05]"
              >
                <div className="ev-section-kicker">Search intent</div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{category.title}</h3>
                <p className="mt-3 text-white/72">{category.description}</p>
              </button>
            </FadeIn>
          ))}
        </section>
      ) : null}

      {sourceSections.length > 0 ? (
        <section className="mt-10">
          <div>
            <div className="ev-kicker">Native discovery lanes</div>
            <h2 className="ev-panel-title mt-2">{discovery.headline}</h2>
            <p className="mt-3 max-w-4xl text-white/66">{discovery.body}</p>
          </div>

          {sourceSections.map((section, sectionIndex) => (
            <div key={section.key} className="mt-8">
              <FadeIn delay={0.04 * sectionIndex}>
                <div>
                  <div className="ev-kicker">{section.eyebrow}</div>
                  <h3 className="mt-2 text-3xl font-semibold text-white">{section.title}</h3>
                </div>
              </FadeIn>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {section.events.slice(0, 6).map((event, index) => (
                  <FadeIn key={event.id} delay={0.04 * index}>
                    <EventDiscoveryCard
                      item={{
                        id: event.id,
                        kind: "native",
                        title: event.title,
                        subtitle: event.sourceLabel,
                        href: event.href,
                        imageUrl: event.imageUrl || getDiscoveryFallbackImage(event.city, event.source),
                        chip: event.badgeLabel,
                        chipClass: getSourceChipClass(event.source),
                        secondaryChip: event.featured ? "Featured" : event.promoCollection,
                        ctaLabel: "Open event",
                        meta: `${event.city}, ${event.state} · ${formatSchedule(event.startAt)}`,
                        body:
                          event.subtitle ||
                          event.heroNote ||
                          event.description ||
                          "A premium live moment built for sharp presentation, city energy, and clean execution.",
                      }}
                    />
                  </FadeIn>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {visibility.showExternalSection ? (
        <section className="mt-10">
          <div>
            <div className="ev-kicker">Expanded city pulse</div>
            <h2 className="ev-panel-title mt-2">{discovery.externalHeadline}</h2>
            <p className="mt-3 max-w-3xl text-white/62">{discovery.disclosure}</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {externalResults.length > 0 ? (
              externalResults.slice(0, 6).map((event, index) => (
                <FadeIn key={event.id} delay={0.04 * index}>
                  <EventDiscoveryCard
                    item={{
                      id: event.id,
                      kind: "external",
                      title: event.title,
                      subtitle: event.venueName || "External discovery",
                      href: event.url,
                      imageUrl: event.imageUrl || getExternalFallbackImage(event.city),
                      chip: "External listing",
                      secondaryChip: "Ticketmaster",
                      ctaLabel: "View listing",
                      meta: `${event.city || "City"}${event.state ? `, ${event.state}` : ""} · ${formatSchedule(event.startAt)}`,
                      body: "Broader city coverage for nights when you want more range without losing a premium event-discovery frame.",
                    }}
                  />
                </FadeIn>
              ))
            ) : (
              <div className="ev-empty lg:col-span-3">
                Search nightlife, music, sports, entertainment, or city names to widen discovery coverage without losing the EVNTSZN point of view.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {visibility.showCityBlocks ? (
        <section className="mt-10 grid gap-4 lg:grid-cols-4">
          {taxonomy.cities.map((cityBlock, index) => (
            <FadeIn key={cityBlock.name} delay={0.04 * index}>
              <button
                type="button"
                onClick={() => runPresetSearch({ city: cityBlock.name })}
                className="ev-panel ev-metal-border text-left transition hover:bg-white/[0.05]"
              >
                <div className="ev-section-kicker">City guide</div>
                <h3 className="mt-3 text-2xl font-semibold text-white">{cityBlock.name}</h3>
                <p className="mt-3 text-white/72">{cityBlock.description}</p>
              </button>
            </FadeIn>
          ))}
        </section>
      ) : null}
    </div>
  );
}
