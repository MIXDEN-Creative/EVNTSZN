"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DiscoveryNativeEvent } from "@/lib/discovery";
import type {
  HomepageBannerContent,
  HomepageDiscoveryContent,
  HomepageTaxonomyContent,
} from "@/lib/site-content";

type DiscoveryResponse = {
  ok?: boolean;
  storageReady?: boolean;
  native?: DiscoveryNativeEvent[];
  external?: Array<{
    id: string;
    title: string;
    url: string | null;
    startAt: string | null;
    venueName: string | null;
    city: string | null;
    state: string | null;
    imageUrl: string | null;
    source: "ticketmaster";
    isPrimary: false;
  }>;
  error?: string;
};

function formatSchedule(value: string | null | undefined) {
  if (!value) {
    return "Schedule pending";
  }

  return new Date(value).toLocaleString();
}

function groupBySource(events: DiscoveryNativeEvent[]) {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent: events.filter((event) => event.source === "independent_organizer"),
  };
}

function renderSourceChip(event: DiscoveryNativeEvent) {
  const chipClass =
    event.source === "evntszn"
      ? "ev-chip ev-chip--evntszn"
      : event.source === "host"
        ? "ev-chip ev-chip--host"
        : "ev-chip ev-chip--independent";

  return <span className={chipClass}>{event.badgeLabel}</span>;
}

export default function DiscoveryLanding({
  featuredNativeEvents,
  banner,
  discovery,
  taxonomy,
}: {
  featuredNativeEvents: DiscoveryNativeEvent[];
  banner: HomepageBannerContent;
  discovery: HomepageDiscoveryContent;
  taxonomy: HomepageTaxonomyContent;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (city.trim()) params.set("city", city.trim());
      const response = await fetch(`/api/discovery/search?${params.toString()}`);
      const payload = (await response.json()) as DiscoveryResponse;
      setResults(payload);
    } finally {
      setLoading(false);
    }
  }

  const currentNativeResults = (results?.native && results.native.length > 0) ? results.native : featuredNativeEvents;
  const groupedNative = useMemo(() => groupBySource(currentNativeResults), [currentNativeResults]);
  const externalResults = results?.external || [];

  const sourceSections: Array<{
    key: "evntszn" | "host" | "independent";
    title: string;
    eyebrow: string;
    events: DiscoveryNativeEvent[];
  }> = [
    {
      key: "evntszn",
      title: discovery.nativeHeadline,
      eyebrow: "Official EVNTSZN",
      events: groupedNative.evntszn,
    },
    {
      key: "host",
      title: discovery.hostHeadline,
      eyebrow: "Hosted inside EVNTSZN",
      events: groupedNative.host,
    },
    {
      key: "independent",
      title: discovery.independentHeadline,
      eyebrow: "Independent Organizer",
      events: groupedNative.independent,
    },
  ];

  return (
    <div className="grid gap-8">
      <section className="ev-panel">
        <div className="ev-section-kicker">{banner.eyebrow}</div>
        <h2 className="ev-panel-title mt-3">{banner.title}</h2>
        <p className="ev-panel-copy mt-3">{banner.body}</p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="ev-panel">
          <div className="ev-section-kicker">Discovery command</div>
          <h2 className="ev-panel-title mt-3">{discovery.headline}</h2>
          <p className="ev-panel-copy">{discovery.body}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="ev-chip ev-chip--evntszn">EVNTSZN events first</span>
            <span className="ev-chip ev-chip--host">EVNTSZN Host events</span>
            <span className="ev-chip ev-chip--independent">Independent organizer listings</span>
            <span className="ev-chip ev-chip--external">External breadth when you want it</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              className="ev-field"
              placeholder={discovery.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <input
              className="ev-field"
              placeholder={discovery.cityPlaceholder}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={runSearch} className="ev-button-primary" type="button">
              {loading ? "Searching..." : "Search discovery"}
            </button>
            <Link href="/account/login?mode=signup&next=/account" className="ev-button-secondary">
              Create attendee account
            </Link>
            <Link href="/account/login?next=/account" className="ev-button-secondary">
              Existing member login
            </Link>
          </div>
        </div>

        <div className="ev-panel">
          <div className="ev-section-kicker">Platform access</div>
          <h2 className="ev-panel-title mt-3">Public discovery. Controlled operator access.</h2>
          <div className="mt-5 space-y-3 text-sm text-white/72">
            <div className="ev-meta-card">
              Attendees can discover events, create an account, buy tickets, and move into a premium EVNTSZN member experience.
            </div>
            <div className="ev-meta-card">
              Official EVNTSZN events carry the highest discovery priority, followed by hosted network events, then verified independent organizer listings.
            </div>
            <div className="ev-meta-card">
              Scanner, organizer, venue, admin, and HQ environments remain invite- and permission-controlled behind their own EVNTSZN surfaces.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="ev-panel">
          <div className="ev-section-kicker">Search intent coverage</div>
          <h2 className="ev-panel-title mt-3">Category depth for discovery at scale</h2>
          <div className="mt-5 grid gap-3">
            {taxonomy.categories.map((category) => (
              <div key={category.title} className="ev-meta-card">
                <div className="ev-meta-label">{category.title}</div>
                <div className="ev-meta-value">{category.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ev-panel">
          <div className="ev-section-kicker">City intent</div>
          <h2 className="ev-panel-title mt-3">Built for city-level event discovery</h2>
          <div className="mt-5 grid gap-3">
            {taxonomy.cities.map((cityBlock) => (
              <div key={cityBlock.name} className="ev-meta-card">
                <div className="ev-meta-label">{cityBlock.name}</div>
                <div className="ev-meta-value">{cityBlock.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sourceSections.map((section) => (
        <section key={section.key} className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="ev-kicker">{section.eyebrow}</div>
              <h2 className="ev-panel-title mt-2">{section.title}</h2>
            </div>
            <Link href="/events" className="text-sm font-medium text-[#d6c5ff] transition hover:text-white">
              Browse all EVNTSZN events
            </Link>
          </div>
          {section.events.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {section.events.map((event) => (
                <article key={event.id} className="ev-panel">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderSourceChip(event)}
                    {event.featured ? <span className="ev-chip ev-chip--featured">Featured</span> : null}
                    {event.promoCollection ? <span className="ev-chip">{event.promoCollection}</span> : null}
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{event.title}</h3>
                  <p className="mt-3 text-sm text-white/65">
                    {event.city}, {event.state} · {formatSchedule(event.startAt)}
                  </p>
                  <p className="mt-4 text-white/72">
                    {event.subtitle || event.heroNote || event.description || "Premium event access with polished EVNTSZN operations behind it."}
                  </p>
                  <div className="mt-5 text-xs uppercase tracking-[0.24em] text-white/45">{event.sourceLabel}</div>
                  <Link href={event.href} className="ev-button-primary mt-6 inline-flex">
                    Open event
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="ev-empty">
              {section.key === "evntszn"
                ? "Search a city or category to see EVNTSZN-native inventory first."
                : section.key === "host"
                  ? "Hosted network events will appear here when promoted through EVNTSZN discovery."
                  : "Independent organizer inventory appears here once native EVNTSZN and hosted experiences have been ranked first."}
            </div>
          )}
        </section>
      ))}

      <section className="grid gap-4">
        <div>
          <div className="ev-kicker">Expanded city pulse</div>
          <h2 className="ev-panel-title mt-2">{discovery.externalHeadline}</h2>
          <p className="mt-2 max-w-3xl text-white/62">{discovery.disclosure}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {externalResults.length > 0 ? (
            externalResults.map((event) => (
              <article key={event.id} className="ev-panel ev-panel-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ev-chip ev-chip--external">External listing</span>
                  <span className="ev-chip">Ticketmaster-backed</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">{event.title}</h3>
                <p className="mt-3 text-sm text-white/65">
                  {event.city}, {event.state} · {formatSchedule(event.startAt)}
                </p>
                <p className="mt-4 text-white/72">{event.venueName || "External discovery result"}</p>
                {event.url ? (
                  <a href={event.url} target="_blank" rel="noreferrer" className="ev-button-secondary mt-6 inline-flex">
                    View external listing
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <div className="ev-empty lg:col-span-3">
              Search a city, artist, category, sports moment, or nightlife cue to expand beyond EVNTSZN-native inventory without losing the premium discovery frame.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
