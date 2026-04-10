"use client";

import { useEffect, useState } from "react";

type ManagedContent = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    tertiaryCtaLabel: string;
    tertiaryCtaHref: string;
  };
  banner: {
    eyebrow: string;
    title: string;
    body: string;
  };
  discovery: {
    headline: string;
    body: string;
    disclosure: string;
    searchPlaceholder: string;
    keywordPlaceholder: string;
    cityPlaceholder: string;
    nativeHeadline: string;
    hostHeadline: string;
    independentHeadline: string;
    externalHeadline: string;
  };
  taxonomy: {
    categories: Array<{ title: string; description: string }>;
    cities: Array<{ name: string; description: string }>;
  };
  visibility: {
    showNativeSection: boolean;
    showHostSection: boolean;
    showIndependentSection: boolean;
    showExternalSection: boolean;
    showEplPanel: boolean;
    showPopularSection: boolean;
    showCategoryBlocks: boolean;
    showCityBlocks: boolean;
  };
  storageReady: boolean;
};

type ManagedEplContent = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  sections: {
    seasonHeadline: string;
    seasonBody: string;
    scheduleHeadline: string;
    scheduleBody: string;
    teamsHeadline: string;
    teamsBody: string;
    standingsHeadline: string;
    standingsBody: string;
    storeHeadline: string;
    storeBody: string;
  };
  menu: {
    showRegister: boolean;
    showSchedule: boolean;
    showTeams: boolean;
    showStandings: boolean;
    showStore: boolean;
    showOpportunities: boolean;
    showDraftCountdown: boolean;
    showFaq: boolean;
  };
  storageReady: boolean;
};

type ManagedPublicModules = {
  citySpotlight: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  teamBlocks: {
    scheduleHeadline: string;
    scheduleBody: string;
    rosterHeadline: string;
    rosterBody: string;
    announcementsHeadline: string;
    announcementsBody: string;
  };
  storePromo: {
    eyebrow: string;
    headline: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  sponsorBlock: {
    eyebrow: string;
    headline: string;
    body: string;
    footerHeadline: string;
  };
  opportunitiesBlock: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  storageReady: boolean;
};

type DiscoveryListing = {
  id: string;
  title: string;
  city: string;
  state: string;
  source: "evntszn" | "host" | "independent_organizer";
  badgeLabel: string;
  featured: boolean;
  listingPriority: number;
  promoCollection: string | null;
};

type ExternalDiscoveryListing = {
  id: string;
  title: string;
  city: string | null;
  state: string | null;
  startAt: string | null;
  venueName: string | null;
  description: string | null;
  moderationStatus: "active" | "featured" | "deprioritized" | "hidden" | "unsuitable";
  priorityAdjustment: number;
  notes?: string | null;
};

function parseLines(value: string, mode: "category" | "city") {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      const description = rest.join("|").trim();

      if (mode === "category") {
        return {
          title: label.trim(),
          description,
        };
      }

      return {
        name: label.trim(),
        description,
      };
    });
}

function serializeCategories(items: Array<{ title: string; description: string }>) {
  return items.map((item) => `${item.title}|${item.description}`).join("\n");
}

function serializeCities(items: Array<{ name: string; description: string }>) {
  return items.map((item) => `${item.name}|${item.description}`).join("\n");
}

export default function DiscoveryAdminClient() {
  const [content, setContent] = useState<ManagedContent | null>(null);
  const [eplContent, setEplContent] = useState<ManagedEplContent | null>(null);
  const [modules, setModules] = useState<ManagedPublicModules | null>(null);
  const [listings, setListings] = useState<DiscoveryListing[]>([]);
  const [externalListings, setExternalListings] = useState<ExternalDiscoveryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [taxonomyCategories, setTaxonomyCategories] = useState("");
  const [taxonomyCities, setTaxonomyCities] = useState("");

  const discoveryStats = {
    native: listings.filter((listing) => listing.source === "evntszn").length,
    hosts: listings.filter((listing) => listing.source === "host").length,
    independent: listings.filter((listing) => listing.source === "independent_organizer").length,
    externalHidden: externalListings.filter((listing) => listing.moderationStatus === "hidden").length,
  };

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/discovery", { cache: "no-store" });
    const payload = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      setMessage(String(payload.error || "Could not load discovery controls."));
      setLoading(false);
      return;
    }

    const nextContent = payload.content as ManagedContent;
    const nextEpl = payload.epl as ManagedEplContent;
    const nextModules = payload.modules as ManagedPublicModules;
    setContent(nextContent);
    setEplContent(nextEpl);
    setModules(nextModules);
    setListings((payload.listings as DiscoveryListing[]) || []);
    setExternalListings((payload.externalListings as ExternalDiscoveryListing[]) || []);
    setTaxonomyCategories(serializeCategories(nextContent.taxonomy.categories));
    setTaxonomyCities(serializeCities(nextContent.taxonomy.cities));
    setMessage(nextContent.storageReady && nextEpl.storageReady && nextModules.storageReady ? null : "Public-surface controls are running on fallback content until the discovery controls migration is applied.");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveContent(key: string, body: Record<string, unknown>, label: string) {
    setSaving(key);
    setMessage(null);

    const response = await fetch("/api/admin/discovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "content",
        key,
        label,
        content: body,
      }),
    });

    const payload = (await response.json()) as Record<string, unknown>;
    setSaving(null);

    if (!response.ok) {
      setMessage(String(payload.error || "Could not save discovery content."));
      return;
    }

    setMessage("Discovery content updated.");
    await load();
  }

  async function saveListing(listing: DiscoveryListing) {
    setSaving(listing.id);
    setMessage(null);

    const response = await fetch("/api/admin/discovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "listing",
        eventId: listing.id,
        sourceType: listing.source,
        badgeLabel: listing.badgeLabel,
        featured: listing.featured,
        listingPriority: listing.listingPriority,
        promoCollection: listing.promoCollection,
        isDiscoverable: true,
      }),
    });

    const payload = (await response.json()) as Record<string, unknown>;
    setSaving(null);

    if (!response.ok) {
      setMessage(String(payload.error || "Could not save listing controls."));
      return;
    }

    setMessage(`Updated discovery controls for ${listing.title}.`);
    await load();
  }

  async function saveExternalListing(listing: ExternalDiscoveryListing) {
    setSaving(`external:${listing.id}`);
    setMessage(null);

    const response = await fetch("/api/admin/discovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "external",
        source: "ticketmaster",
        externalEventId: listing.id,
        title: listing.title,
        city: listing.city,
        state: listing.state,
        startsAt: listing.startAt,
        status: listing.moderationStatus,
        priorityAdjustment: listing.priorityAdjustment,
        overrideSummary: listing.description,
        notes: listing.notes || null,
      }),
    });

    const payload = (await response.json()) as Record<string, unknown>;
    setSaving(null);

    if (!response.ok) {
      setMessage(String(payload.error || "Could not save external moderation controls."));
      return;
    }

    setMessage(`Updated external moderation for ${listing.title}.`);
    await load();
  }

  if (loading || !content || !eplContent || !modules) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <div className="ev-empty">Loading discovery controls...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] p-6">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Discovery Control</div>
            <h1 className="ev-title">Edit homepage messaging, feature native events, and moderate external inventory.</h1>
            <p className="ev-subtitle">
              Work section by section. Update homepage copy, adjust city/category blocks, set native event visibility, and keep external inventory clean without turning this into a page builder.
            </p>
          </div>
          <div className="ev-hero-meta">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Native listings</div>
              <div className="ev-meta-value">
                {discoveryStats.native} EVNTSZN · {discoveryStats.hosts} host · {discoveryStats.independent} independent
              </div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Status</div>
              <div className="ev-meta-value">{message || "Discovery controls are connected."}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">External hidden</div>
              <div className="ev-meta-value">{discoveryStats.externalHidden} listings are currently suppressed.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 ev-panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-white/62">
            Stay inside the current single-page model. Work top to bottom: homepage copy first, taxonomy and shared modules next, then listing and moderation controls.
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["#homepage-hero", "Homepage hero"],
            ["#homepage-copy", "Homepage copy"],
            ["#taxonomy-blocks", "Taxonomy"],
            ["#public-modules", "Public modules"],
            ["#listing-controls", "Listing controls"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-white/72 hover:bg-white/10">
              {label}
            </a>
          ))}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid gap-6">
          <div id="homepage-hero" className="ev-panel">
            <div className="ev-section-kicker">Homepage hero</div>
            <p className="mt-3 text-sm text-white/62">
              Use the larger fields here for the main public headline, opener, and CTA stack. This is the top-of-funnel message block for discovery.
            </p>
            <div className="mt-5 grid gap-4">
              <input className="ev-field" value={content.hero.eyebrow} onChange={(event) => setContent({ ...content, hero: { ...content.hero, eyebrow: event.target.value } })} />
              <input className="ev-field" value={content.hero.title} onChange={(event) => setContent({ ...content, hero: { ...content.hero, title: event.target.value } })} />
              <textarea className="ev-textarea" rows={6} value={content.hero.description} onChange={(event) => setContent({ ...content, hero: { ...content.hero, description: event.target.value } })} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className="ev-field" value={content.hero.primaryCtaLabel} onChange={(event) => setContent({ ...content, hero: { ...content.hero, primaryCtaLabel: event.target.value } })} />
              <input className="ev-field" value={content.hero.primaryCtaHref} onChange={(event) => setContent({ ...content, hero: { ...content.hero, primaryCtaHref: event.target.value } })} />
              <input className="ev-field" value={content.hero.secondaryCtaLabel} onChange={(event) => setContent({ ...content, hero: { ...content.hero, secondaryCtaLabel: event.target.value } })} />
              <input className="ev-field" value={content.hero.secondaryCtaHref} onChange={(event) => setContent({ ...content, hero: { ...content.hero, secondaryCtaHref: event.target.value } })} />
              <input className="ev-field" value={content.hero.tertiaryCtaLabel} onChange={(event) => setContent({ ...content, hero: { ...content.hero, tertiaryCtaLabel: event.target.value } })} />
              <input className="ev-field" value={content.hero.tertiaryCtaHref} onChange={(event) => setContent({ ...content, hero: { ...content.hero, tertiaryCtaHref: event.target.value } })} />
            </div>
            <button
              type="button"
              className="ev-button-primary mt-5"
              disabled={saving === "homepage.hero"}
              onClick={() => saveContent("homepage.hero", content.hero, "Homepage Hero")}
            >
              {saving === "homepage.hero" ? "Saving..." : "Save hero"}
            </button>
          </div>

          <div id="homepage-copy" className="ev-panel">
            <div className="ev-section-kicker">Homepage message blocks</div>
            <div className="mt-5 grid gap-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white/78">Banner</div>
                <input className="ev-field" value={content.banner.eyebrow} onChange={(event) => setContent({ ...content, banner: { ...content.banner, eyebrow: event.target.value } })} />
                <input className="ev-field mt-3" value={content.banner.title} onChange={(event) => setContent({ ...content, banner: { ...content.banner, title: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={5} value={content.banner.body} onChange={(event) => setContent({ ...content, banner: { ...content.banner, body: event.target.value } })} />
                <button
                  type="button"
                  className="ev-button-secondary mt-4"
                  disabled={saving === "homepage.banner"}
                  onClick={() => saveContent("homepage.banner", content.banner, "Homepage Banner")}
                >
                  {saving === "homepage.banner" ? "Saving..." : "Save banner"}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white/78">Search and discovery copy</div>
                <input className="ev-field" value={content.discovery.headline} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, headline: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={6} value={content.discovery.body} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, body: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={4} value={content.discovery.disclosure} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, disclosure: event.target.value } })} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={content.discovery.searchPlaceholder} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, searchPlaceholder: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.keywordPlaceholder} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, keywordPlaceholder: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.cityPlaceholder} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, cityPlaceholder: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.nativeHeadline} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, nativeHeadline: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.hostHeadline} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, hostHeadline: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.independentHeadline} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, independentHeadline: event.target.value } })} />
                  <input className="ev-field" value={content.discovery.externalHeadline} onChange={(event) => setContent({ ...content, discovery: { ...content.discovery, externalHeadline: event.target.value } })} />
                </div>
                <button
                  type="button"
                  className="ev-button-secondary mt-4"
                  disabled={saving === "homepage.discovery"}
                  onClick={() => saveContent("homepage.discovery", content.discovery, "Homepage Discovery")}
                >
                  {saving === "homepage.discovery" ? "Saving..." : "Save discovery copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="ev-panel">
            <div className="ev-section-kicker">Homepage visibility</div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["showNativeSection", "Show EVNTSZN event section"],
                ["showHostSection", "Show EVNTSZN Host section"],
                ["showIndependentSection", "Show Independent Organizer section"],
                ["showExternalSection", "Show external discovery section"],
                ["showEplPanel", "Show EPL homepage spotlight"],
                ["showPopularSection", "Show popular/search results rail"],
                ["showCategoryBlocks", "Show category intent blocks"],
                ["showCityBlocks", "Show city blocks"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 text-sm text-white/72">
                  <input
                    type="checkbox"
                    checked={content.visibility[key as keyof ManagedContent["visibility"]]}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        visibility: {
                          ...content.visibility,
                          [key]: event.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="ev-button-primary mt-5"
              disabled={saving === "homepage.visibility"}
              onClick={() => saveContent("homepage.visibility", content.visibility, "Homepage Visibility")}
            >
              {saving === "homepage.visibility" ? "Saving..." : "Save visibility"}
            </button>
          </div>
        </section>

        <section className="grid gap-6">
          <div id="taxonomy-blocks" className="ev-panel">
            <div className="ev-section-kicker">Taxonomy blocks</div>
            <p className="mt-3 text-sm text-white/65">Use one line per block with the format `Label|Description`.</p>
            <label className="mt-5 block text-sm font-medium text-white/72">Categories</label>
            <textarea className="ev-textarea mt-2" rows={8} value={taxonomyCategories} onChange={(event) => setTaxonomyCategories(event.target.value)} />
            <label className="mt-5 block text-sm font-medium text-white/72">Cities</label>
            <textarea className="ev-textarea mt-2" rows={8} value={taxonomyCities} onChange={(event) => setTaxonomyCities(event.target.value)} />
            <button
              type="button"
              className="ev-button-primary mt-5"
              disabled={saving === "homepage.taxonomy"}
              onClick={() =>
                saveContent(
                  "homepage.taxonomy",
                  {
                    categories: parseLines(taxonomyCategories, "category"),
                    cities: parseLines(taxonomyCities, "city"),
                  },
                  "Homepage Taxonomy",
                )
              }
            >
              {saving === "homepage.taxonomy" ? "Saving..." : "Save taxonomy"}
            </button>
          </div>

          <div id="public-modules" className="ev-panel">
            <div className="ev-section-kicker">Public module copy</div>
            <p className="mt-3 text-sm text-white/65">
              Manage the shared copy blocks that feed city pages, team pages, sponsor placement sections, the EPL store promo, and the public opportunities surface.
            </p>
            <div className="mt-5 grid gap-5">
              <div>
                <div className="text-sm font-medium text-white/78">City spotlight</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.citySpotlight.eyebrow} onChange={(event) => setModules({ ...modules, citySpotlight: { ...modules.citySpotlight, eyebrow: event.target.value } })} />
                  <input className="ev-field" value={modules.citySpotlight.headline} onChange={(event) => setModules({ ...modules, citySpotlight: { ...modules.citySpotlight, headline: event.target.value } })} />
                </div>
                <textarea className="ev-textarea mt-3" rows={5} value={modules.citySpotlight.body} onChange={(event) => setModules({ ...modules, citySpotlight: { ...modules.citySpotlight, body: event.target.value } })} />
              </div>

              <div>
                <div className="text-sm font-medium text-white/78">Team page blocks</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.teamBlocks.scheduleHeadline} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, scheduleHeadline: event.target.value } })} />
                  <input className="ev-field" value={modules.teamBlocks.rosterHeadline} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, rosterHeadline: event.target.value } })} />
                </div>
                <textarea className="ev-textarea mt-3" rows={5} value={modules.teamBlocks.scheduleBody} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, scheduleBody: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={5} value={modules.teamBlocks.rosterBody} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, rosterBody: event.target.value } })} />
                <input className="ev-field mt-3" value={modules.teamBlocks.announcementsHeadline} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, announcementsHeadline: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={5} value={modules.teamBlocks.announcementsBody} onChange={(event) => setModules({ ...modules, teamBlocks: { ...modules.teamBlocks, announcementsBody: event.target.value } })} />
              </div>

              <div>
                <div className="text-sm font-medium text-white/78">Store promo</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.storePromo.eyebrow} onChange={(event) => setModules({ ...modules, storePromo: { ...modules.storePromo, eyebrow: event.target.value } })} />
                  <input className="ev-field" value={modules.storePromo.headline} onChange={(event) => setModules({ ...modules, storePromo: { ...modules.storePromo, headline: event.target.value } })} />
                </div>
                <textarea className="ev-textarea mt-3" rows={5} value={modules.storePromo.body} onChange={(event) => setModules({ ...modules, storePromo: { ...modules.storePromo, body: event.target.value } })} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.storePromo.ctaLabel} onChange={(event) => setModules({ ...modules, storePromo: { ...modules.storePromo, ctaLabel: event.target.value } })} />
                  <input className="ev-field" value={modules.storePromo.ctaHref} onChange={(event) => setModules({ ...modules, storePromo: { ...modules.storePromo, ctaHref: event.target.value } })} />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-white/78">Sponsor blocks</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.sponsorBlock.eyebrow} onChange={(event) => setModules({ ...modules, sponsorBlock: { ...modules.sponsorBlock, eyebrow: event.target.value } })} />
                  <input className="ev-field" value={modules.sponsorBlock.footerHeadline} onChange={(event) => setModules({ ...modules, sponsorBlock: { ...modules.sponsorBlock, footerHeadline: event.target.value } })} />
                </div>
                <input className="ev-field mt-3" value={modules.sponsorBlock.headline} onChange={(event) => setModules({ ...modules, sponsorBlock: { ...modules.sponsorBlock, headline: event.target.value } })} />
                <textarea className="ev-textarea mt-3" rows={5} value={modules.sponsorBlock.body} onChange={(event) => setModules({ ...modules, sponsorBlock: { ...modules.sponsorBlock, body: event.target.value } })} />
              </div>

              <div>
                <div className="text-sm font-medium text-white/78">Opportunities feature</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={modules.opportunitiesBlock.eyebrow} onChange={(event) => setModules({ ...modules, opportunitiesBlock: { ...modules.opportunitiesBlock, eyebrow: event.target.value } })} />
                  <input className="ev-field" value={modules.opportunitiesBlock.headline} onChange={(event) => setModules({ ...modules, opportunitiesBlock: { ...modules.opportunitiesBlock, headline: event.target.value } })} />
                </div>
                <textarea className="ev-textarea mt-3" rows={5} value={modules.opportunitiesBlock.body} onChange={(event) => setModules({ ...modules, opportunitiesBlock: { ...modules.opportunitiesBlock, body: event.target.value } })} />
              </div>

              <button
                type="button"
                className="ev-button-primary"
                disabled={saving === "public.modules"}
                onClick={() =>
                  saveContent(
                    "public.modules",
                    {
                      citySpotlight: modules.citySpotlight,
                      teamBlocks: modules.teamBlocks,
                      storePromo: modules.storePromo,
                      sponsorBlock: modules.sponsorBlock,
                      opportunitiesBlock: modules.opportunitiesBlock,
                    },
                    "Public Modules",
                  )
                }
              >
                {saving === "public.modules" ? "Saving..." : "Save public modules"}
              </button>
            </div>
          </div>

          <div id="listing-controls" className="ev-panel">
            <div className="ev-section-kicker">Listing controls</div>
            <p className="mt-3 text-sm text-white/65">
              Adjust native event positioning without opening every event record. Keep this list focused on what should surface first.
            </p>
            <div className="mt-5 space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-base font-semibold text-white">{listing.title}</div>
                      <div className="mt-1 text-sm text-white/55">
                        {listing.city}, {listing.state}
                      </div>
                    </div>

                    <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_140px_160px_auto]">
                      <select
                        className="ev-select"
                        value={listing.source}
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id
                                ? { ...item, source: event.target.value as DiscoveryListing["source"] }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="evntszn">EVNTSZN Event</option>
                        <option value="host">EVNTSZN Host Event</option>
                        <option value="independent_organizer">Independent Organizer Event</option>
                      </select>
                      <input
                        className="ev-field"
                        value={listing.badgeLabel}
                        placeholder="Badge label"
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id ? { ...item, badgeLabel: event.target.value } : item,
                            ),
                          )
                        }
                      />
                      <input
                        type="number"
                        className="ev-field"
                        placeholder="Priority"
                        value={listing.listingPriority}
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id
                                ? { ...item, listingPriority: Number(event.target.value || 0) }
                                : item,
                            ),
                          )
                        }
                      />
                      <input
                        className="ev-field"
                        placeholder="Collection"
                        value={listing.promoCollection || ""}
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id ? { ...item, promoCollection: event.target.value || null } : item,
                            ),
                          )
                        }
                      />
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                        <input
                          type="checkbox"
                          checked={listing.featured}
                          onChange={(event) =>
                            setListings((current) =>
                              current.map((item) =>
                                item.id === listing.id ? { ...item, featured: event.target.checked } : item,
                              ),
                            )
                          }
                        />
                        Featured
                      </label>
                      <button
                        type="button"
                        className="ev-button-secondary"
                        disabled={saving === listing.id}
                        onClick={() => saveListing(listing)}
                      >
                        {saving === listing.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ev-panel">
            <div className="ev-section-kicker">External moderation</div>
            <p className="mt-3 text-sm text-white/65">
              Use compact controls here. Change status, adjust rank, and only open override fields when you need to correct a source issue.
            </p>
            <div className="mt-5 space-y-4">
              {externalListings.map((listing) => (
                <div key={listing.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-white">{listing.title}</div>
                        <div className="mt-1 text-sm text-white/55">
                          {listing.venueName || "External venue"}{listing.city ? ` · ${listing.city}` : ""}{listing.state ? `, ${listing.state}` : ""}
                        </div>
                      </div>
                      <span className="ev-chip ev-chip--external">{listing.moderationStatus.replace(/_/g, " ")}</span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto]">
                      <select
                        className="ev-select"
                        value={listing.moderationStatus}
                        onChange={(event) =>
                          setExternalListings((current) =>
                            current.map((item) =>
                              item.id === listing.id
                                ? { ...item, moderationStatus: event.target.value as ExternalDiscoveryListing["moderationStatus"] }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="active">Active</option>
                        <option value="featured">Featured</option>
                        <option value="deprioritized">De-prioritized</option>
                        <option value="hidden">Hidden</option>
                        <option value="unsuitable">Unsuitable</option>
                      </select>
                      <input
                        type="number"
                        className="ev-field"
                        placeholder="Rank"
                        value={listing.priorityAdjustment}
                        onChange={(event) =>
                          setExternalListings((current) =>
                            current.map((item) =>
                              item.id === listing.id
                                ? { ...item, priorityAdjustment: Number(event.target.value || 0) }
                                : item,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="ev-button-secondary"
                        disabled={saving === `external:${listing.id}`}
                        onClick={() => saveExternalListing(listing)}
                      >
                        {saving === `external:${listing.id}` ? "Saving..." : "Save"}
                      </button>
                    </div>

                    <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-white">Override summary and notes</summary>
                      <div className="mt-4 grid gap-3">
                        <textarea
                          className="ev-textarea"
                          rows={4}
                          placeholder="Optional public summary override"
                          value={listing.description || ""}
                          onChange={(event) =>
                            setExternalListings((current) =>
                              current.map((item) =>
                                item.id === listing.id ? { ...item, description: event.target.value } : item,
                              ),
                            )
                          }
                        />
                        <textarea
                          className="ev-textarea"
                          rows={3}
                          placeholder="Internal moderation note"
                          value={listing.notes || ""}
                          onChange={(event) =>
                            setExternalListings((current) =>
                              current.map((item) =>
                                item.id === listing.id ? { ...item, notes: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ev-panel">
            <div className="ev-section-kicker">EPL public page</div>
            <p className="mt-3 text-sm text-white/65">
              Control the public league landing page, hero copy, and menu visibility without turning EPL into a page-builder.
            </p>

            <div className="mt-5 space-y-6">
              <div>
                <input className="ev-field" value={eplContent.hero.eyebrow} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, eyebrow: event.target.value } })} />
                <input className="ev-field mt-3" value={eplContent.hero.title} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, title: event.target.value } })} />
                <textarea className="ev-textarea mt-3" value={eplContent.hero.description} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, description: event.target.value } })} />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={eplContent.hero.primaryCtaLabel} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, primaryCtaLabel: event.target.value } })} />
                  <input className="ev-field" value={eplContent.hero.primaryCtaHref} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, primaryCtaHref: event.target.value } })} />
                  <input className="ev-field" value={eplContent.hero.secondaryCtaLabel} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, secondaryCtaLabel: event.target.value } })} />
                  <input className="ev-field" value={eplContent.hero.secondaryCtaHref} onChange={(event) => setEplContent({ ...eplContent, hero: { ...eplContent.hero, secondaryCtaHref: event.target.value } })} />
                </div>
                <button
                  type="button"
                  className="ev-button-secondary mt-4"
                  disabled={saving === "epl.hero"}
                  onClick={() => saveContent("epl.hero", eplContent.hero, "EPL Hero")}
                >
                  {saving === "epl.hero" ? "Saving..." : "Save EPL hero"}
                </button>
              </div>

              <div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="ev-field" value={eplContent.sections.seasonHeadline} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, seasonHeadline: event.target.value } })} />
                  <textarea className="ev-textarea" value={eplContent.sections.seasonBody} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, seasonBody: event.target.value } })} />
                  <input className="ev-field" value={eplContent.sections.scheduleHeadline} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, scheduleHeadline: event.target.value } })} />
                  <textarea className="ev-textarea" value={eplContent.sections.scheduleBody} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, scheduleBody: event.target.value } })} />
                  <input className="ev-field" value={eplContent.sections.teamsHeadline} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, teamsHeadline: event.target.value } })} />
                  <textarea className="ev-textarea" value={eplContent.sections.teamsBody} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, teamsBody: event.target.value } })} />
                  <input className="ev-field" value={eplContent.sections.standingsHeadline} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, standingsHeadline: event.target.value } })} />
                  <textarea className="ev-textarea" value={eplContent.sections.standingsBody} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, standingsBody: event.target.value } })} />
                  <input className="ev-field" value={eplContent.sections.storeHeadline} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, storeHeadline: event.target.value } })} />
                  <textarea className="ev-textarea" value={eplContent.sections.storeBody} onChange={(event) => setEplContent({ ...eplContent, sections: { ...eplContent.sections, storeBody: event.target.value } })} />
                </div>
                <button
                  type="button"
                  className="ev-button-secondary mt-4"
                  disabled={saving === "epl.sections"}
                  onClick={() => saveContent("epl.sections", eplContent.sections, "EPL Sections")}
                >
                  {saving === "epl.sections" ? "Saving..." : "Save EPL sections"}
                </button>
              </div>

              <div>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["showRegister", "Show Register"],
                    ["showSchedule", "Show Schedule"],
                    ["showTeams", "Show Teams"],
                    ["showStandings", "Show Standings"],
                    ["showStore", "Show Store"],
                    ["showOpportunities", "Show Opportunities"],
                    ["showDraftCountdown", "Show Draft Countdown"],
                    ["showFaq", "Show FAQ"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 text-sm text-white/72">
                      <input
                        type="checkbox"
                        checked={eplContent.menu[key as keyof ManagedEplContent["menu"]]}
                        onChange={(event) =>
                          setEplContent({
                            ...eplContent,
                            menu: {
                              ...eplContent.menu,
                              [key]: event.target.checked,
                            },
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="ev-button-primary mt-4"
                  disabled={saving === "epl.menu"}
                  onClick={() => saveContent("epl.menu", eplContent.menu, "EPL Menu")}
                >
                  {saving === "epl.menu" ? "Saving..." : "Save EPL menu"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
