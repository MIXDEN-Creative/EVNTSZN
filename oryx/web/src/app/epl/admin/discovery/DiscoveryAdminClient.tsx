"use client";

import { useEffect, useState } from "react";
import type { ActivitySourceKey } from "@/lib/activity-source";
import { getSourceMixLabel } from "@/lib/discovery-intelligence";

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

type SourceMixMetric = Record<ActivitySourceKey, { count: number; share: number }>;

type DiscoveryCityMaturityState = "strong" | "growing" | "imported_fallback";

type DiscoveryCityPromotionStatus =
  | "stable"
  | "promotion_ready"
  | "hold"
  | "declining"
  | "fallback_needed";

type DiscoveryCityPromotionEvaluation = {
  status: DiscoveryCityPromotionStatus;
  nextLevel: DiscoveryCityMaturityState | null;
  missingSignals: string[];
  promotionReason: string;
  isEligibleForPromotion: boolean;
};

type DiscoveryCityAutomationStatus = "monitoring" | "accelerating" | "recovering" | "intervening";

type DiscoveryCityOpsFlag =
  | "growth_ready"
  | "needs_curator_supply"
  | "needs_partner_supply"
  | "needs_native_inventory"
  | "needs_momentum"
  | "watch_decline"
  | "fallback_support_mode"
  | "ready_for_manual_review";

type DiscoveryCityAutomationPolicy = {
  status: DiscoveryCityAutomationStatus;
  label: string;
  reason: string;
  confidence: number;
  reviewWindowDays: number;
  nativeWeightAdjustment: number;
  importedToleranceAdjustment: number;
  opsFlags: DiscoveryCityOpsFlag[];
  actionPlan: string[];
};

type DiscoveryCityAutomationIntelligence = {
  policy: DiscoveryCityAutomationPolicy;
  isOverridden: boolean;
  overrideReason?: string;
  forcedPolicyStatus?: DiscoveryCityAutomationStatus | null;
  forcedMaturityState?: DiscoveryCityMaturityState | null;
  suppressPromotion?: boolean;
  lastEvaluatedAt?: string | null;
  nextEvaluationAt: string;
};

type DiscoveryCityIntelligence = {
  city: string;
  citySlug: string;
  totalUsableInventory: number;
  sourceMix: SourceMixMetric;
  maturityScore: number;
  maturityLabel: DiscoveryCityMaturityState;
  policy: {
    state: DiscoveryCityMaturityState;
    label: string;
    explanation: string;
    homepageBehavior: string;
    searchBehavior: string;
    momentumBehavior: string;
    automationStatus: DiscoveryCityAutomationStatus;
    automationIntelligence: DiscoveryCityAutomationIntelligence;
  };
  policyReason: string;
  promotionEvaluation: DiscoveryCityPromotionEvaluation;
  automationStatus: DiscoveryCityAutomationStatus;
  automationIntelligence: DiscoveryCityAutomationIntelligence;
  trendDirection: "up" | "down" | "flat";
  trendDeltaPercent: number;
  momentumSourceMix: SourceMixMetric;
  dominantMomentumSource: ActivitySourceKey | null;
  topSlots: SourceMixMetric;
  nativeLifted: boolean;
  importedDominating: boolean;
  outcomeLabel: string;
};

type DiscoveryIntelligenceSnapshot = {
  generatedAt: string;
  overallInventory: number;
  overallSourceMix: SourceMixMetric;
  overallMomentumSourceMix: SourceMixMetric;
  cityRows: DiscoveryCityIntelligence[];
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

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatTrendLabel(direction: DiscoveryCityIntelligence["trendDirection"], delta: number) {
  if (direction === "flat") return "Flat";
  const prefix = direction === "up" ? "+" : "";
  return `${prefix}${delta}%`;
}

function getMaturityTone(label: DiscoveryCityIntelligence["maturityLabel"]) {
  switch (label) {
    case "strong":
      return "text-emerald-300";
    case "growing":
      return "text-violet-200";
    default:
      return "text-amber-200";
  }
}

function getPromotionTone(status: DiscoveryCityPromotionStatus) {
  switch (status) {
    case "promotion_ready":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "hold":
      return "text-amber-300 bg-amber-300/10 border-amber-300/20";
    case "declining":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "fallback_needed":
      return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    default:
      return "text-white/40 bg-white/5 border-white/10";
  }
}

function getPromotionLabel(status: DiscoveryCityPromotionStatus) {
  switch (status) {
    case "promotion_ready":
      return "Promotion Ready";
    case "hold":
      return "On Hold";
    case "declining":
      return "Declining";
    case "fallback_needed":
      return "Fallback Needed";
    default:
      return "Stable";
  }
}

function getAutomationTone(status: DiscoveryCityAutomationStatus) {
  switch (status) {
    case "accelerating":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "recovering":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "intervening":
      return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    default:
      return "text-blue-300 bg-blue-300/10 border-blue-300/20";
  }
}

function getOpsFlagLabel(flag: DiscoveryCityOpsFlag) {
  switch (flag) {
    case "growth_ready":
      return "Growth Ready";
    case "needs_curator_supply":
      return "Curator Supply Gap";
    case "needs_partner_supply":
      return "Partner Supply Gap";
    case "needs_native_inventory":
      return "Native Supply Gap";
    case "needs_momentum":
      return "Momentum Gap";
    case "watch_decline":
      return "Watch Decline";
    case "fallback_support_mode":
      return "Fallback Support";
    case "ready_for_manual_review":
      return "Manual Review Ready";
    default:
      return flag;
  }
}

type AutomationDraft = {
  forcedPolicyStatus: DiscoveryCityAutomationStatus | "";
  forcedMaturityState: DiscoveryCityMaturityState | "";
  suppressPromotion: boolean;
  overrideReason: string;
};

export default function DiscoveryAdminClient() {
  const [activeSection, setActiveSection] = useState<"homepage" | "modules" | "listings" | "external" | "intelligence" | "epl">("homepage");
  const [content, setContent] = useState<ManagedContent | null>(null);
  const [eplContent, setEplContent] = useState<ManagedEplContent | null>(null);
  const [modules, setModules] = useState<ManagedPublicModules | null>(null);
  const [listings, setListings] = useState<DiscoveryListing[]>([]);
  const [externalListings, setExternalListings] = useState<ExternalDiscoveryListing[]>([]);
  const [intelligence, setIntelligence] = useState<DiscoveryIntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [taxonomyCategories, setTaxonomyCategories] = useState("");
  const [taxonomyCities, setTaxonomyCities] = useState("");
  const [listingQuery, setListingQuery] = useState("");
  const [externalQuery, setExternalQuery] = useState("");
  const [automationDrafts, setAutomationDrafts] = useState<Record<string, AutomationDraft>>({});

  const discoveryStats = {
    native: listings.filter((listing) => listing.source === "evntszn").length,
    hosts: listings.filter((listing) => listing.source === "host").length,
    independent: listings.filter((listing) => listing.source === "independent_organizer").length,
    externalHidden: externalListings.filter((listing) => listing.moderationStatus === "hidden").length,
  };

  const overallTopSource = intelligence
    ? (Object.entries(intelligence.overallSourceMix).sort((a, b) => b[1].count - a[1].count)[0]?.[0] as ActivitySourceKey | undefined)
    : undefined;

  const filteredListings = listings.filter((listing) => {
    const normalizedQuery = listingQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return [listing.title, listing.city, listing.state, listing.source, listing.badgeLabel, listing.promoCollection]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const filteredExternalListings = externalListings.filter((listing) => {
    const normalizedQuery = externalQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return [listing.title, listing.city, listing.state, listing.venueName, listing.moderationStatus]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

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
    setIntelligence((payload.intelligence as DiscoveryIntelligenceSnapshot) || null);
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

  function getAutomationDraft(row: DiscoveryCityIntelligence): AutomationDraft {
    return automationDrafts[row.citySlug] || {
      forcedPolicyStatus: row.automationIntelligence.forcedPolicyStatus || "",
      forcedMaturityState: row.automationIntelligence.forcedMaturityState || "",
      suppressPromotion: Boolean(row.automationIntelligence.suppressPromotion),
      overrideReason: row.automationIntelligence.overrideReason || "",
    };
  }

  async function updateAutomation(action: "set_override" | "clear_override" | "evaluate_city" | "evaluate_all", row?: DiscoveryCityIntelligence) {
    setSaving(action === "evaluate_all" ? "automation:all" : row ? `automation:${row.citySlug}` : "automation");
    setMessage(null);

    const draft = row ? getAutomationDraft(row) : null;
    const response = await fetch("/api/admin/discovery/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "set_override"
          ? {
              action,
              cityKey: row?.citySlug,
              cityLabel: row?.city,
              forcedPolicyStatus: draft?.forcedPolicyStatus || null,
              forcedMaturityState: draft?.forcedMaturityState || null,
              suppressPromotion: Boolean(draft?.suppressPromotion),
              overrideReason: draft?.overrideReason?.trim() || null,
            }
          : action === "clear_override"
            ? {
                action,
                cityKey: row?.citySlug,
                cityLabel: row?.city,
              }
            : action === "evaluate_city"
              ? {
                  action,
                  cityKey: row?.citySlug,
                }
              : { action },
      ),
    });

    const payload = (await response.json()) as Record<string, unknown>;
    setSaving(null);

    if (!response.ok) {
      setMessage(String(payload.error || "Could not update automation controls."));
      return;
    }

    setMessage(
      action === "evaluate_all"
        ? "City automation re-evaluated across all tracked markets."
        : action === "evaluate_city"
          ? `Re-evaluated ${row?.city}.`
          : action === "clear_override"
            ? `Cleared override for ${row?.city}.`
            : `Updated override for ${row?.city}.`,
    );
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
                {discoveryStats.native} EVNTSZN · {discoveryStats.hosts} EVNTSZN Curator · {discoveryStats.independent} Partner
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
            <div className="ev-meta-card">
              <div className="ev-meta-label">City source mix</div>
              <div className="ev-meta-value">
                {intelligence && overallTopSource
                  ? `${getSourceMixLabel(overallTopSource)} leads ${formatPercent(intelligence.overallSourceMix[overallTopSource].share)} of current discovery inventory.`
                  : "Source intelligence is loading."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 ev-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-white/62">
            Use this as a working control desk: homepage copy, public modules, native event placement, external moderation, and EPL public copy all stay here.
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["homepage", "Homepage"],
            ["modules", "Public modules"],
            ["listings", "Native listings"],
            ["external", "External moderation"],
            ["intelligence", "City intelligence"],
            ["epl", "EPL public"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key as typeof activeSection)}
              className={`rounded-full px-4 py-2 font-semibold ${
                activeSection === key ? "bg-white text-black" : "border border-white/10 bg-black/30 text-white/72 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8">
        {activeSection === "homepage" ? (
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
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
                ["showHostSection", "Show EVNTSZN Curator section"],
                ["showIndependentSection", "Show Partner section"],
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
                        <option value="host">EVNTSZN Curator Event</option>
                        <option value="independent_organizer">Partner Event</option>
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
        ) : null}

        {activeSection === "modules" ? (
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Module guide</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Control the copy blocks that feed city, team, store, sponsor, and opportunities surfaces.</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                City spotlight controls the city-page opener.
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                Team page blocks control schedule, roster, and announcement support copy.
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                Store, sponsor, and opportunities blocks feed public conversion surfaces without opening separate editors.
              </div>
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
          </section>
        </div>
        ) : null}

        {activeSection === "listings" ? (
        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Native listing queue</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Manage which EVNTSZN events actually show up on discovery.</h2>
            <p className="mt-2 text-sm text-white/65">
              Use featured, priority, collection, and discoverable state to control homepage/discovery placement without opening every event record.
            </p>
            <input
              className="ev-field mt-5"
              placeholder="Search title, city, source, or collection"
              value={listingQuery}
              onChange={(event) => setListingQuery(event.target.value)}
            />
            <div className="mt-5 space-y-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 xl:max-w-sm">
                      <div className="text-lg font-semibold text-white">{listing.title}</div>
                      <div className="mt-2 text-sm text-white/58">
                        {[listing.city, listing.state, listing.source.replace(/_/g, " ")].filter(Boolean).join(" • ")}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {listing.featured ? <span className="ev-chip ev-chip--external">Featured</span> : null}
                        {listing.promoCollection ? <span className="ev-chip ev-chip--external">{listing.promoCollection}</span> : null}
                      </div>
                    </div>

                    <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_170px_120px_150px_auto]">
                      <input
                        className="ev-field"
                        value={listing.badgeLabel}
                        placeholder="Badge label"
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) => (item.id === listing.id ? { ...item, badgeLabel: event.target.value } : item)),
                          )
                        }
                      />
                      <select
                        className="ev-select"
                        value={listing.source}
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id ? { ...item, source: event.target.value as DiscoveryListing["source"] } : item,
                            ),
                          )
                        }
                      >
                        <option value="evntszn">EVNTSZN event</option>
                        <option value="host">EVNTSZN Curator</option>
                        <option value="independent_organizer">Partner</option>
                      </select>
                      <input
                        type="number"
                        className="ev-field"
                        placeholder="Priority"
                        value={listing.listingPriority}
                        onChange={(event) =>
                          setListings((current) =>
                            current.map((item) =>
                              item.id === listing.id ? { ...item, listingPriority: Number(event.target.value || 0) } : item,
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
                            current.map((item) => (item.id === listing.id ? { ...item, promoCollection: event.target.value || null } : item)),
                          )
                        }
                      />
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                        <input
                          type="checkbox"
                          checked={listing.featured}
                          onChange={(event) =>
                            setListings((current) =>
                              current.map((item) => (item.id === listing.id ? { ...item, featured: event.target.checked } : item)),
                            )
                          }
                        />
                        Featured
                      </label>
                      <button type="button" className="ev-button-secondary" disabled={saving === listing.id} onClick={() => saveListing(listing)}>
                        {saving === listing.id ? "Saving..." : "Save placement"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Placement rules</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Homepage and discovery placement should be intentional.</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                Use <span className="text-white">Featured</span> for the events that should rise first on homepage/discovery.
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                Use <span className="text-white">Priority</span> to push listings up or down inside the discovery feed.
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">
                Use <span className="text-white">Collection</span> to group events into a promo lane or homepage slice.
              </div>
            </div>
          </section>
        </div>
        ) : null}

        {activeSection === "external" ? (
        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">External moderation</div>
            <h2 className="mt-3 text-2xl font-bold text-white">Keep Ticketmaster and Eventbrite inventory clean.</h2>
            <input
              className="ev-field mt-5"
              placeholder="Search title, venue, city, or status"
              value={externalQuery}
              onChange={(event) => setExternalQuery(event.target.value)}
            />
            <div className="mt-5 space-y-4">
              {filteredExternalListings.map((listing) => (
                <div key={listing.id} className="rounded-3xl border border-white/10 bg-black/25 p-5">
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
                              item.id === listing.id ? { ...item, moderationStatus: event.target.value as ExternalDiscoveryListing["moderationStatus"] } : item,
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
                              item.id === listing.id ? { ...item, priorityAdjustment: Number(event.target.value || 0) } : item,
                            ),
                          )
                        }
                      />
                      <button type="button" className="ev-button-secondary" disabled={saving === `external:${listing.id}`} onClick={() => saveExternalListing(listing)}>
                        {saving === `external:${listing.id}` ? "Saving..." : "Save moderation"}
                      </button>
                    </div>

                    <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-white">Override summary and notes</summary>
                      <div className="mt-4 grid gap-3">
                        <textarea className="ev-textarea" rows={4} placeholder="Optional public summary override" value={listing.description || ""} onChange={(event) => setExternalListings((current) => current.map((item) => (item.id === listing.id ? { ...item, description: event.target.value } : item)))} />
                        <textarea className="ev-textarea" rows={3} placeholder="Internal moderation note" value={listing.notes || ""} onChange={(event) => setExternalListings((current) => current.map((item) => (item.id === listing.id ? { ...item, notes: event.target.value } : item)))} />
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Moderation guide</div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">Use <span className="text-white">Featured</span> only when the external listing deserves homepage-level weight.</div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">Use <span className="text-white">Hidden</span> or <span className="text-white">Unsuitable</span> when the event should not surface to customers.</div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-6 text-white/65">Use override summary and notes only when the source description needs correction.</div>
            </div>
          </section>
        </div>
        ) : null}

        {activeSection === "intelligence" ? (
        <div className="grid gap-8">
          <section className="ev-panel p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="ev-section-kicker">City supply intelligence</div>
                <h2 className="mt-3 text-2xl font-bold text-white">See where EVNTSZN is still dependent on imported inventory and where native supply is starting to win.</h2>
                <p className="mt-3 text-sm text-white/65">
                  This uses the same source model and city-aware weighting logic the public discovery stack is using. Operators can read city maturity, momentum source mix, active automation, and override state.
                </p>
              </div>
              <button
                type="button"
                className="ev-button-primary"
                disabled={saving === "automation:all"}
                onClick={() => updateAutomation("evaluate_all")}
              >
                {saving === "automation:all" ? "Evaluating..." : "Run all evaluations"}
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="ev-meta-card">
                <div className="ev-meta-label">Total usable inventory</div>
                <div className="ev-meta-value">{intelligence?.overallInventory || 0}</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">EVNTSZN Native share</div>
                <div className="ev-meta-value">{intelligence ? formatPercent(intelligence.overallSourceMix.evntszn_native.share) : "0%"}</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Curator + Partner share</div>
                <div className="ev-meta-value">
                  {intelligence
                    ? formatPercent(intelligence.overallSourceMix.curator_network.share + intelligence.overallSourceMix.partner.share)
                    : "0%"}
                </div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Imported dependency</div>
                <div className="ev-meta-value">{intelligence ? formatPercent(intelligence.overallSourceMix.imported.share) : "0%"}</div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-sm font-medium text-white/78">Overall discovery source mix</div>
                <div className="mt-4 grid gap-3">
                  {intelligence ? (Object.entries(intelligence.overallSourceMix) as Array<[ActivitySourceKey, { count: number; share: number }]>).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm text-white/72">
                      <span>{getSourceMixLabel(key)}</span>
                      <span>{value.count} · {formatPercent(value.share)}</span>
                    </div>
                  )) : null}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <div className="text-sm font-medium text-white/78">Overall momentum source mix</div>
                <div className="mt-4 grid gap-3">
                  {intelligence ? (Object.entries(intelligence.overallMomentumSourceMix) as Array<[ActivitySourceKey, { count: number; share: number }]>).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm text-white/72">
                      <span>{getSourceMixLabel(key)}</span>
                      <span>{value.count} · {formatPercent(value.share)}</span>
                    </div>
                  )) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Market-by-market visibility</div>
            <div className="mt-5 space-y-4">
              {(intelligence?.cityRows || []).map((row) => (
                <div key={row.citySlug} className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="xl:max-w-sm">
                      <div className="text-lg font-semibold text-white">{row.city}</div>
                      <div className="mt-2 text-sm text-white/58">
                        {row.totalUsableInventory} usable listings · trend {formatTrendLabel(row.trendDirection, row.trendDeltaPercent)}
                      </div>
                      <div className={`mt-3 text-sm font-semibold ${getMaturityTone(row.maturityLabel)}`}>
                        {Math.round(row.maturityScore * 100)}% maturity · {row.maturityLabel.replace(/_/g, " ")}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getPromotionTone(row.promotionEvaluation.status)}`}>
                          {getPromotionLabel(row.promotionEvaluation.status)}
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getAutomationTone(row.automationStatus)}`}>
                          Policy: {row.automationIntelligence.policy.label}
                        </div>
                        {row.promotionEvaluation.nextLevel && (
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                            Target: {row.promotionEvaluation.nextLevel.replace(/_/g, " ")}
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-sm leading-6 text-white/65">{row.outcomeLabel}</p>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Active policy</div>
                        <div className="mt-2 text-sm font-semibold text-white">{row.policy.label}</div>
                        <div className="mt-2 text-sm leading-6 text-white/65">{row.policy.explanation}</div>
                        <div className="mt-2 text-xs leading-5 text-white/48">{row.policyReason}</div>
                        
                        <div className="mt-6 pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/32">Automation Intelligence</div>
                            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Confidence {Math.round(row.automationIntelligence.policy.confidence * 100)}%</div>
                          </div>
                          <div className="mt-3 text-sm font-semibold text-white/90">{row.automationIntelligence.policy.reason}</div>
                          
                          {row.automationIntelligence.policy.opsFlags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {row.automationIntelligence.policy.opsFlags.map((flag) => (
                                <div key={flag} className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-semibold text-white/50">
                                  {getOpsFlagLabel(flag)}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Action Plan</div>
                            {row.automationIntelligence.policy.actionPlan.map((action, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400/40" />
                                {action}
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between text-[10px] text-white/25">
                            <div>
                              Last evaluation {row.automationIntelligence.lastEvaluatedAt ? new Date(row.automationIntelligence.lastEvaluatedAt).toLocaleString() : "Pending first run"}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-white/25">
                            <div>Next evaluation {new Date(row.automationIntelligence.nextEvaluationAt).toLocaleString()}</div>
                            {row.automationIntelligence.isOverridden && (
                              <div className="text-orange-400/80 font-bold uppercase tracking-widest">Manual Override Active</div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/32">Promotion Signals</div>
                          <div className="mt-2 text-xs leading-5 text-white/72">{row.promotionEvaluation.promotionReason}</div>
                          {row.promotionEvaluation.missingSignals.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                              {row.promotionEvaluation.missingSignals.map((signal) => (
                                <div key={signal} className="text-[10px] text-rose-300/65">
                                  × {signal}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid flex-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Source mix</div>
                        <div className="mt-3 grid gap-2 text-sm text-white/72">
                          {(Object.entries(row.sourceMix) as Array<[ActivitySourceKey, { count: number; share: number }]>).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span>{getSourceMixLabel(key)}</span>
                              <span>{value.count} · {formatPercent(value.share)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Momentum source</div>
                        <div className="mt-3 grid gap-2 text-sm text-white/72">
                          {(Object.entries(row.momentumSourceMix) as Array<[ActivitySourceKey, { count: number; share: number }]>).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span>{getSourceMixLabel(key)}</span>
                              <span>{value.count} · {formatPercent(value.share)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Ranking outcome</div>
                        <div className="mt-3 grid gap-2 text-sm text-white/72">
                          <div className="flex items-center justify-between">
                            <span>Top slots: EVNTSZN</span>
                            <span>{formatPercent(row.topSlots.evntszn_native.share)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Top slots: Curator + Partner</span>
                            <span>{formatPercent(row.topSlots.curator_network.share + row.topSlots.partner.share)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Top slots: Imported</span>
                            <span>{formatPercent(row.topSlots.imported.share)}</span>
                          </div>
                          <div className="mt-2 text-xs text-white/52">
                            {row.nativeLifted ? "Native supply is being lifted." : row.importedDominating ? "Fallback is still dominating." : "Source balance is mixed."}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Policy actions</div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-white/72">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Homepage</div>
                            <div className="mt-2 leading-6">{row.policy.homepageBehavior}</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Search</div>
                            <div className="mt-2 leading-6">{row.policy.searchBehavior}</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Momentum</div>
                            <div className="mt-2 leading-6">{row.policy.momentumBehavior}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Automation controls</div>
                          <button
                            type="button"
                            className="ev-button-secondary"
                            disabled={saving === `automation:${row.citySlug}`}
                            onClick={() => updateAutomation("evaluate_city", row)}
                          >
                            {saving === `automation:${row.citySlug}` ? "Running..." : "Re-evaluate city"}
                          </button>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <select
                            className="ev-select"
                            value={getAutomationDraft(row).forcedPolicyStatus}
                            onChange={(event) =>
                              setAutomationDrafts((current) => ({
                                ...current,
                                [row.citySlug]: {
                                  ...getAutomationDraft(row),
                                  forcedPolicyStatus: event.target.value as DiscoveryCityAutomationStatus | "",
                                },
                              }))
                            }
                          >
                            <option value="">Use evaluated policy</option>
                            <option value="monitoring">Monitoring</option>
                            <option value="accelerating">Accelerating</option>
                            <option value="recovering">Recovering</option>
                            <option value="intervening">Intervening</option>
                          </select>
                          <select
                            className="ev-select"
                            value={getAutomationDraft(row).forcedMaturityState}
                            onChange={(event) =>
                              setAutomationDrafts((current) => ({
                                ...current,
                                [row.citySlug]: {
                                  ...getAutomationDraft(row),
                                  forcedMaturityState: event.target.value as DiscoveryCityMaturityState | "",
                                },
                              }))
                            }
                          >
                            <option value="">Use evaluated maturity</option>
                            <option value="imported_fallback">Imported fallback</option>
                            <option value="growing">Growing</option>
                            <option value="strong">Strong</option>
                          </select>
                          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                            <input
                              type="checkbox"
                              checked={getAutomationDraft(row).suppressPromotion}
                              onChange={(event) =>
                                setAutomationDrafts((current) => ({
                                  ...current,
                                  [row.citySlug]: {
                                    ...getAutomationDraft(row),
                                    suppressPromotion: event.target.checked,
                                  },
                                }))
                              }
                            />
                            Suppress promotion
                          </label>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/62">
                            Effective policy
                            <div className="mt-1 font-semibold text-white">{row.policy.label}</div>
                          </div>
                        </div>
                        <textarea
                          className="ev-textarea mt-3"
                          rows={3}
                          placeholder="Override reason"
                          value={getAutomationDraft(row).overrideReason}
                          onChange={(event) =>
                            setAutomationDrafts((current) => ({
                              ...current,
                              [row.citySlug]: {
                                ...getAutomationDraft(row),
                                overrideReason: event.target.value,
                              },
                            }))
                          }
                        />
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="ev-button-primary"
                            disabled={saving === `automation:${row.citySlug}`}
                            onClick={() => updateAutomation("set_override", row)}
                          >
                            {saving === `automation:${row.citySlug}` ? "Saving..." : "Save override"}
                          </button>
                          <button
                            type="button"
                            className="ev-button-secondary"
                            disabled={saving === `automation:${row.citySlug}`}
                            onClick={() => updateAutomation("clear_override", row)}
                          >
                            Clear override
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        ) : null}

        {activeSection === "epl" ? (
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">EPL public page</div>
            <p className="mt-3 text-sm text-white/65">
              Control the public league landing page, hero copy, and menu visibility without turning EPL into a page builder.
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
                <button type="button" className="ev-button-secondary mt-4" disabled={saving === "epl.hero"} onClick={() => saveContent("epl.hero", eplContent.hero, "EPL Hero")}>
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
                <button type="button" className="ev-button-secondary mt-4" disabled={saving === "epl.sections"} onClick={() => saveContent("epl.sections", eplContent.sections, "EPL Sections")}>
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
                <button type="button" className="ev-button-primary mt-4" disabled={saving === "epl.menu"} onClick={() => saveContent("epl.menu", eplContent.menu, "EPL Menu")}>
                  {saving === "epl.menu" ? "Saving..." : "Save EPL menu"}
                </button>
              </div>
            </div>
          </section>
        </div>
        ) : null}
      </div>
    </main>
  );
}
