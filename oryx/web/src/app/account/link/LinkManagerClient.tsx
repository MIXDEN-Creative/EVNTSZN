"use client";

import { useEffect, useMemo, useState } from "react";
import { LINK_PLAN_CONFIG, type LinkPlan } from "@/lib/platform-products";
import { formatUsd } from "@/lib/money";

type AvailableEvent = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  state: string | null;
  start_at: string;
};

type AvailableCrew = {
  id: string;
  display_name: string;
  slug: string;
  category: string;
  custom_category: string | null;
  city: string | null;
  state: string | null;
  availability_state: string;
};

type LinkEditorPayload = {
  page: {
    slug: string;
    display_name: string | null;
    headline: string | null;
    intro: string | null;
    city: string | null;
    state: string | null;
    profile_image_url: string | null;
    primary_email: string | null;
    accent_label: string | null;
    status: "draft" | "published";
    plan_tier: LinkPlan;
    fee_bearing_enabled: boolean;
    monthly_price_usd: number | null;
    email_capture_enabled: boolean;
  };
  socialLinks: Array<{ id?: string; platform: string; label: string | null; url: string }>;
  offers: Array<{ id?: string; offer_type: string; title: string; description: string | null; href: string; cta_label: string; price_label: string | null; fee_amount_usd: number | null }>;
  featuredEventIds: string[];
  featuredCrewIds: string[];
  availableEvents: AvailableEvent[];
  availableCrew: AvailableCrew[];
  usage: {
    eventsUsed: number;
    eventLimit: number;
    viewCount: number;
    leadCount: number;
    totalGoing: number;
    totalClicks: number;
    uniqueClicks: number;
    attributedOrderCount: number;
    attributedTicketCount: number;
    attributedGrossRevenueUsd: number;
    conversionRate: number | null;
  };
  billing: {
    status: string;
    hasSubscription: boolean;
  };
  onboarding: {
    completedCount: number;
    totalCount: number;
    complete: boolean;
    nextStep: { key: string; label: string; complete: boolean; detail: string } | null;
    steps: Array<{ key: string; label: string; complete: boolean; detail: string }>;
  };
  performance: {
    topEvents: Array<{
      eventId: string;
      title: string;
      slug: string;
      clicks: number;
      orders: number;
      tickets: number;
      grossRevenueUsd: number;
    }>;
    recentConversions: Array<{
      id: string;
      eventTitle: string;
      eventSlug: string;
      convertedAt: string;
      orderCount: number;
      ticketCount: number;
      grossRevenueUsd: number;
      attributionMethod: string;
    }>;
  };
  featureMatrix: {
    plan: LinkPlan;
    currentPlanLabel: string;
    maxActiveEvents: number;
    brandingEnforced: boolean;
    leadCaptureUnlocked: boolean;
    funnelPagesUnlocked: boolean;
    advancedAnalyticsUnlocked: boolean;
    priorityPlacementUnlocked: boolean;
    advancedToolsUnlocked: boolean;
  };
  error?: string;
};

type LinkApiError = {
  error?: string;
  code?: string;
  blockedFeature?: "branding" | "event_limit" | "lead_capture" | "funnel_pages" | "advanced_tools";
  requiredPlan?: LinkPlan;
  currentPlan?: LinkPlan;
};

const EMPTY_SOCIAL = { platform: "Instagram", label: "", url: "" };
const EMPTY_OFFER = { offerType: "digital_product", title: "", description: "", href: "", ctaLabel: "Open", priceLabel: "", feeAmountUsd: "" };
const PLAN_ORDER: LinkPlan[] = ["free", "starter", "pro", "elite"];

export default function LinkManagerClient() {
  const [payload, setPayload] = useState<LinkEditorPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeState, setUpgradeState] = useState<LinkApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useMemo(() => {
    if (!payload) return null;
    return {
      slug: payload.page.slug,
      displayName: payload.page.display_name || "",
      headline: payload.page.headline || "",
      intro: payload.page.intro || "",
      city: payload.page.city || "",
      state: payload.page.state || "",
      profileImageUrl: payload.page.profile_image_url || "",
      primaryEmail: payload.page.primary_email || "",
      accentLabel: payload.page.accent_label || "",
      status: payload.page.status,
      planTier: payload.page.plan_tier,
      feeBearingEnabled: payload.page.fee_bearing_enabled,
      monthlyPriceUsd: payload.page.monthly_price_usd ? String(payload.page.monthly_price_usd) : "",
      emailCaptureEnabled: payload.page.email_capture_enabled,
      socialLinks: payload.socialLinks.length
        ? payload.socialLinks.map((item) => ({
            platform: item.platform,
            label: item.label || "",
            url: item.url,
          }))
        : [EMPTY_SOCIAL],
      offers: payload.offers.length
        ? payload.offers.map((item) => ({
            offerType: item.offer_type,
            title: item.title,
            description: item.description || "",
            href: item.href,
            ctaLabel: item.cta_label,
            priceLabel: item.price_label || "",
            feeAmountUsd: item.fee_amount_usd ? String(item.fee_amount_usd) : "",
          }))
        : [EMPTY_OFFER],
      featuredEventIds: payload.featuredEventIds,
      featuredCrewIds: payload.featuredCrewIds,
    };
  }, [payload]);

  const [draft, setDraft] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/evntszn/link", { cache: "no-store" });
    const json = (await res.json()) as LinkEditorPayload;
    if (!res.ok) {
      setMessage(json.error || "Could not load EVNTSZN Link.");
      return;
    }
    setPayload(json);
    setDraft(null);
    setMessage(null);
    setUpgradeState(null);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (form) {
      setDraft(form);
    }
  }, [form]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/evntszn/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        monthlyPriceUsd: draft.monthlyPriceUsd ? Number(draft.monthlyPriceUsd) : null,
        socialLinks: draft.socialLinks,
        offers: draft.offers.map((offer: any) => ({
          ...offer,
          feeAmountUsd: offer.feeAmountUsd ? Number(offer.feeAmountUsd) : null,
        })),
        featuredCrewIds: draft.featuredCrewIds,
      }),
    });
    const json = (await res.json()) as LinkEditorPayload & LinkApiError;
    if (!res.ok) {
      if (res.status === 403) {
        setUpgradeState(json);
      }
      setMessage(json.error || "Could not save EVNTSZN Link.");
    } else {
      setPayload(json);
      setMessage("EVNTSZN Link saved.");
      setUpgradeState(null);
    }
    setSaving(false);
  }

  if (!payload || !draft) {
    return <div className="text-white/60">Loading EVNTSZN Link...</div>;
  }

  const currentPlan = payload.featureMatrix.plan;
  const planConfig = LINK_PLAN_CONFIG[currentPlan];
  const eventsAtLimit = draft.featuredEventIds.length >= payload.featureMatrix.maxActiveEvents;
  const eventsUsed = Math.min(draft.featuredEventIds.length, payload.featureMatrix.maxActiveEvents);

  async function startUpgrade(plan: Exclude<LinkPlan, "free">) {
    setMessage(null);
    setUpgradeState(null);
    const res = await fetch("/api/evntszn/link/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      setMessage(json.error || "Could not start checkout.");
      return;
    }
    window.location.href = json.url;
  }

  async function cancelSubscription() {
    setMessage(null);
    setUpgradeState(null);
    const res = await fetch("/api/evntszn/link/cancel", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not cancel subscription.");
      return;
    }
    await load();
    setMessage("EVNTSZN Link subscription canceled. Plan returned to Free.");
  }

  function requirePlan(targetPlan: LinkPlan, messageText: string) {
    if (PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(targetPlan)) {
      return true;
    }
    setUpgradeState({
      error: messageText,
      requiredPlan: targetPlan,
      currentPlan,
    });
    setMessage(messageText);
    return false;
  }

  return (
    <div className="space-y-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">EVNTSZN Link</div>
            <h1 className="ev-title">Build a curator conversion page that actually moves people.</h1>
            <p className="ev-subtitle">
              Manage identity, social links, live event promotion, email capture, and paid offers from one internal desk.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Current plan</div>
              <div className="ev-meta-value text-base">{planConfig.label} · {planConfig.priceLabel}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Event usage</div>
              <div className="ev-meta-value text-base">{eventsUsed}/{payload.usage.eventLimit} events used</div>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">{message}</div>
      ) : null}

      {upgradeState?.requiredPlan ? (
        <section className="ev-panel border-[#A259FF]/25 bg-[linear-gradient(135deg,rgba(162,89,255,0.12),rgba(255,255,255,0.03)),rgba(5,5,8,0.82)] p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="ev-section-kicker">Upgrade required</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {upgradeState.blockedFeature === "event_limit"
                  ? "You hit your current event limit."
                  : upgradeState.blockedFeature === "branding"
                    ? "Branding removal is locked."
                    : upgradeState.blockedFeature === "lead_capture"
                      ? "Lead capture is locked."
                      : upgradeState.blockedFeature === "funnel_pages"
                        ? "Funnel sections are locked."
                        : "Advanced controls are locked."}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
                {upgradeState.error || `Upgrade to ${LINK_PLAN_CONFIG[upgradeState.requiredPlan].label} to unlock this action.`}
              </p>
            </div>
            <button type="button" onClick={() => void startUpgrade(upgradeState.requiredPlan as Exclude<LinkPlan, "free">)} className="ev-button-primary">
              Upgrade to {LINK_PLAN_CONFIG[upgradeState.requiredPlan].label}
            </button>
          </div>
        </section>
      ) : null}

      <section className="ev-panel p-7 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="ev-section-kicker">Subscription</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Plan, usage, and upgrade pressure.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">
              Your Link stays live on the current plan. Upgrade when you need more event lanes, funnel tools, or analytics depth.
            </p>
          </div>
          <button type="button" onClick={() => void startUpgrade(currentPlan === "free" ? "starter" : currentPlan === "starter" ? "pro" : "elite")} className="ev-button-primary">
            Upgrade EVNTSZN Link
          </button>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {PLAN_ORDER.map((plan) => {
            const card = LINK_PLAN_CONFIG[plan];
            const active = currentPlan === plan;
            return (
              <div key={plan} className={`rounded-[24px] border p-5 ${active ? "border-[#A259FF]/35 bg-[#A259FF]/10" : "border-white/10 bg-black/20"}`}>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">{card.label}</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">{card.priceLabel}</div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-white/68">
                  <div>{card.maxActiveEvents === 1 ? "1 active event" : "Multiple active events"}</div>
                  <div>{card.brandingEnforced ? "EVNTSZN branding enforced" : "Branding can be removed"}</div>
                  <div>{card.leadCapture ? "Lead capture unlocked" : "Lead capture locked"}</div>
                  <div>{card.advancedAnalytics ? "Advanced analytics unlocked" : "Basic analytics only"}</div>
                </div>
                {active ? (
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/82">Current plan</div>
                ) : plan !== "free" ? (
                  <button type="button" onClick={() => void startUpgrade(plan)} className="mt-4 rounded-full border border-white/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black">
                    Upgrade
                  </button>
                ) : (
                  <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/50">Entry tier</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="ev-meta-card">
            <div className="ev-meta-label">Public URL</div>
            <div className="ev-meta-value text-base">/{payload.page.slug}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Status</div>
            <div className="ev-meta-value capitalize">{payload.page.status}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Views</div>
            <div className="ev-meta-value">{payload.usage.viewCount}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">{payload.featureMatrix.advancedAnalyticsUnlocked ? "Attributed revenue" : "Analytics"}</div>
            <div className="ev-meta-value">{payload.featureMatrix.advancedAnalyticsUnlocked ? formatUsd(payload.usage.attributedGrossRevenueUsd) : "Upgrade to Pro"}</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80">
            Billing status: <span className="capitalize text-white">{payload.billing.status.replace(/_/g, " ")}</span>
          </div>
          {payload.billing.hasSubscription ? (
            <button type="button" onClick={() => void cancelSubscription()} className="ev-button-secondary">
              Cancel subscription
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="ev-panel p-7 md:p-8">
          <div className="ev-section-kicker">Onboarding</div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            {payload.onboarding.complete ? "Your Link is ready to share." : "Finish setup in a few clean steps."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            {payload.onboarding.complete
              ? "The page is live, events are attached, and social traffic can start landing here."
              : payload.onboarding.nextStep?.detail || "Complete the next best action to get this Link moving."}
          </p>
          <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/78">
            {payload.onboarding.completedCount}/{payload.onboarding.totalCount} steps complete
          </div>
          <div className="mt-6 grid gap-3">
            {payload.onboarding.steps.map((step, index) => (
              <div key={step.key} className={`rounded-[22px] border p-4 ${step.complete ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-black/20"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${step.complete ? "bg-emerald-500 text-black" : "border border-white/10 bg-white/5 text-white/72"}`}>
                    {step.complete ? "✓" : index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{step.label}</div>
                    <div className="mt-1 text-sm leading-6 text-white/62">{step.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {!payload.onboarding.complete ? (
              <button type="button" onClick={() => {
                const nextKey = payload.onboarding.nextStep?.key;
                if (nextKey === "add_event") {
                  document.getElementById("link-live-events")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                if (nextKey === "add_socials") {
                  document.getElementById("link-social-links")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                if (nextKey === "publish_share") {
                  document.getElementById("link-identity")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }} className="ev-button-primary">
                {payload.onboarding.nextStep?.key === "add_event"
                  ? "Add first event"
                  : payload.onboarding.nextStep?.key === "add_socials"
                    ? "Add social links"
                    : payload.onboarding.nextStep?.key === "publish_share"
                      ? "Publish your page"
                      : "Review setup"}
              </button>
            ) : null}
            <a href={`/${draft.slug}`} target="_blank" rel="noreferrer" className="ev-button-secondary">
              {payload.onboarding.complete ? "Open ready-to-share page" : "Preview public page"}
            </a>
          </div>
        </section>

        <section className="ev-panel p-7 md:p-8">
          <div className="ev-section-kicker">Value</div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Attention and conversion value from this page.</h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            These are real Link metrics only. Revenue is not shown unless it can be tied honestly to page-driven EVNTSZN-native purchases.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Views</div>
              <div className="ev-meta-value">{payload.usage.viewCount}</div>
              <div className="mt-2 text-xs text-white/50">Total page visits tracked</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Total clicks</div>
              <div className="ev-meta-value">{payload.usage.totalClicks}</div>
              <div className="mt-2 text-xs text-white/50">Outbound EVNTSZN event clicks from this page</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Unique clicks</div>
              <div className="ev-meta-value">{payload.usage.uniqueClicks}</div>
              <div className="mt-2 text-xs text-white/50">Session/fingerprint deduped event clicks</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Leads captured</div>
              <div className="ev-meta-value">{payload.featureMatrix.leadCaptureUnlocked ? payload.usage.leadCount : "Locked"}</div>
              <div className="mt-2 text-xs text-white/50">
                {payload.featureMatrix.leadCaptureUnlocked ? "Real captured leads from this page" : "Upgrade to Pro to turn visits into signups"}
              </div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Active events linked</div>
              <div className="ev-meta-value">{eventsUsed}</div>
              <div className="mt-2 text-xs text-white/50">Events currently sending traffic through this page</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Ticket demand</div>
              <div className="ev-meta-value">{payload.usage.totalGoing}</div>
              <div className="mt-2 text-xs text-white/50">Current “going” count across linked EVNTSZN events</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Attributed revenue</div>
              <div className="ev-meta-value">{payload.featureMatrix.advancedAnalyticsUnlocked ? formatUsd(payload.usage.attributedGrossRevenueUsd) : "Locked"}</div>
              <div className="mt-2 text-xs text-white/50">
                {payload.featureMatrix.advancedAnalyticsUnlocked ? "Gross EVNTSZN-native ticket revenue attributed to this Link" : "Upgrade to Pro to unlock attributed revenue tracking"}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Attributed orders</div>
              <div className="ev-meta-value">{payload.featureMatrix.advancedAnalyticsUnlocked ? payload.usage.attributedOrderCount : "Locked"}</div>
              <div className="mt-2 text-xs text-white/50">Paid orders truthfully tied to this Link</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Attributed tickets</div>
              <div className="ev-meta-value">{payload.featureMatrix.advancedAnalyticsUnlocked ? payload.usage.attributedTicketCount : "Locked"}</div>
              <div className="mt-2 text-xs text-white/50">Tickets sold from attributed orders</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Conversion rate</div>
              <div className="ev-meta-value">
                {payload.featureMatrix.advancedAnalyticsUnlocked
                  ? payload.usage.conversionRate !== null
                    ? `${payload.usage.conversionRate}%`
                    : "No data"
                  : "Locked"}
              </div>
              <div className="mt-2 text-xs text-white/50">Attributed orders divided by unique Link clicks</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Plan-aware value</div>
              <div className="ev-meta-value">{payload.featureMatrix.advancedAnalyticsUnlocked ? "Unlocked" : "Upgrade"}</div>
              <div className="mt-2 text-xs text-white/50">Advanced conversion visibility starts on Pro</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-bold text-white">Why upgrade matters</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-white/66">
                <div>Free traffic without lead capture means visitors can leave without becoming contacts.</div>
                <div>Starter removes branding and expands event capacity, but lead capture is still locked.</div>
                <div>Pro is the first plan that turns traffic into captured demand.</div>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-bold text-white">Plan-aware pressure</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-white/66">
                <div>{payload.featureMatrix.leadCaptureUnlocked ? "Lead capture is active on your plan." : "Lead capture is locked on your current plan."}</div>
                <div>{payload.featureMatrix.advancedAnalyticsUnlocked ? "Advanced analytics are available." : "Upgrade to Pro for deeper conversion visibility."}</div>
                <div>{payload.featureMatrix.advancedToolsUnlocked ? "Elite optimization flags are available." : "Elite unlocks reserved optimization controls."}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-bold text-white">Top performing linked events</div>
              <div className="mt-4 grid gap-3">
                {payload.performance.topEvents.length ? payload.performance.topEvents.map((event) => (
                  <div key={event.eventId} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{event.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {event.clicks} clicks • {event.orders} orders • {event.tickets} tickets
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#d9c4ff]">{formatUsd(event.grossRevenueUsd)}</div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/58">
                    No Link-attributed event performance yet.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-bold text-white">Recent attributed conversions</div>
              <div className="mt-4 grid gap-3">
                {payload.performance.recentConversions.length ? payload.performance.recentConversions.map((conversion) => (
                  <div key={conversion.id} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{conversion.eventTitle}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {new Date(conversion.convertedAt).toLocaleString()} • {conversion.ticketCount} tickets • {conversion.attributionMethod.replace(/_/g, " ")}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#d9c4ff]">{formatUsd(conversion.grossRevenueUsd)}</div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/58">
                    No attributed conversions have been recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-white/62">
            Link attribution uses a 7-day window and only credits real EVNTSZN-native paid ticket orders. Cross-device purchases or sessions without a surviving click cookie can still remain unattributed.
          </div>
        </section>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <section id="link-identity" className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Identity</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="ev-field" placeholder="Display name" value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
              <input className="ev-field" placeholder="Public slug" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
              <input className="ev-field md:col-span-2" placeholder="Headline" value={draft.headline} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} />
              <textarea className="ev-textarea md:col-span-2" rows={4} placeholder="Short intro" value={draft.intro} onChange={(event) => setDraft({ ...draft, intro: event.target.value })} />
              <input className="ev-field" placeholder="City" value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
              <input className="ev-field" placeholder="State" value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} />
              <input className="ev-field" placeholder="Profile image URL" value={draft.profileImageUrl} onChange={(event) => setDraft({ ...draft, profileImageUrl: event.target.value })} />
              <input className="ev-field" placeholder="Primary email" value={draft.primaryEmail} onChange={(event) => setDraft({ ...draft, primaryEmail: event.target.value })} />
              <input className="ev-field" placeholder="Accent label" value={draft.accentLabel} disabled={payload.featureMatrix.brandingEnforced} onChange={(event) => setDraft({ ...draft, accentLabel: event.target.value })} />
              <select className="ev-field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            {payload.featureMatrix.brandingEnforced ? (
              <div className="mt-4 rounded-[20px] border border-[#A259FF]/20 bg-[#A259FF]/10 px-4 py-3 text-sm text-[#eadcff]">
                EVNTSZN branding stays enforced on the Free plan. Upgrade to Starter to remove it.
              </div>
            ) : null}
          </section>

          <section id="link-social-links" className="ev-panel p-7 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Social links</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Direct every social lane.</h2>
              </div>
              <button type="button" onClick={() => setDraft({ ...draft, socialLinks: [...draft.socialLinks, EMPTY_SOCIAL] })} className="ev-button-secondary">
                Add link
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              {draft.socialLinks.map((item: any, index: number) => (
                <div key={`${item.platform}-${index}`} className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 md:grid-cols-[0.9fr_0.9fr_1.2fr_auto]">
                  <input className="ev-field" placeholder="Platform" value={item.platform} onChange={(event) => {
                    const next = [...draft.socialLinks];
                    next[index] = { ...next[index], platform: event.target.value };
                    setDraft({ ...draft, socialLinks: next });
                  }} />
                  <input className="ev-field" placeholder="Label" value={item.label} onChange={(event) => {
                    const next = [...draft.socialLinks];
                    next[index] = { ...next[index], label: event.target.value };
                    setDraft({ ...draft, socialLinks: next });
                  }} />
                  <input className="ev-field" placeholder="URL" value={item.url} onChange={(event) => {
                    const next = [...draft.socialLinks];
                    next[index] = { ...next[index], url: event.target.value };
                    setDraft({ ...draft, socialLinks: next });
                  }} />
                  <button type="button" onClick={() => setDraft({ ...draft, socialLinks: draft.socialLinks.filter((_: any, rowIndex: number) => rowIndex !== index) })} className="rounded-full border border-red-500/20 px-4 py-3 text-sm font-bold text-red-200">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="space-y-8">
          <section className="ev-panel p-7 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="ev-section-kicker">Offers</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Publish tickets, products, or paid links.</h2>
              </div>
              <button type="button" onClick={() => {
                if (!requirePlan("pro", "Upgrade to Pro to unlock funnel pages and paid offers.")) return;
                setDraft({ ...draft, offers: [...draft.offers, EMPTY_OFFER] });
              }} className="ev-button-secondary">
                Add offer
              </button>
            </div>

            {!payload.featureMatrix.funnelPagesUnlocked ? (
              <div className="mt-5 rounded-[22px] border border-[#A259FF]/20 bg-[#A259FF]/10 px-4 py-3 text-sm text-[#eadcff]">
                Upgrade to Pro to unlock funnel pages, paid offers, and deeper conversion flows.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {draft.offers.map((offer: any, index: number) => (
                <div key={`${offer.title}-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="ev-field" placeholder="Offer title" value={offer.title} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], title: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <input className="ev-field" placeholder="Type" value={offer.offerType} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], offerType: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <input className="ev-field md:col-span-2" placeholder="Offer URL" value={offer.href} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], href: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <textarea className="ev-textarea md:col-span-2" rows={3} placeholder="Description" value={offer.description} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], description: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <input className="ev-field" placeholder="CTA label" value={offer.ctaLabel} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], ctaLabel: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <input className="ev-field" placeholder="Price label" value={offer.priceLabel} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], priceLabel: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                    <input className="ev-field" placeholder="Fee amount USD (optional)" value={offer.feeAmountUsd} onChange={(event) => {
                      const next = [...draft.offers];
                      next[index] = { ...next[index], feeAmountUsd: event.target.value };
                      setDraft({ ...draft, offers: next });
                    }} />
                  </div>
                  <button type="button" onClick={() => setDraft({ ...draft, offers: draft.offers.filter((_: any, rowIndex: number) => rowIndex !== index) })} className="mt-4 rounded-full border border-red-500/20 px-4 py-2 text-sm font-bold text-red-200">
                    Remove offer
                  </button>
                </div>
              ))}
              {!payload.featureMatrix.funnelPagesUnlocked ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                  Funnel pages and offer blocks are locked on Free and Starter.
                </div>
              ) : null}
            </div>
          </section>

          <section id="link-live-events" className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Live event promotion</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Feature real EVNTSZN events.</h2>
            <div className="mt-5 grid gap-3">
              {payload.availableEvents.map((event) => {
                const checked = draft.featuredEventIds.includes(event.id);
                return (
                  <label key={event.id} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (!checked && eventsAtLimit) {
                          setMessage(`You are using ${payload.usage.eventLimit}/${payload.usage.eventLimit} events on the ${planConfig.label} plan. Upgrade to add more.`);
                          return;
                        }
                        setDraft({
                          ...draft,
                          featuredEventIds: checked
                            ? draft.featuredEventIds.filter((id: string) => id !== event.id)
                            : [...draft.featuredEventIds, event.id],
                        });
                      }}
                      className="mt-1 h-4 w-4 accent-[#A259FF]"
                    />
                    <span>
                      <div className="text-sm font-bold text-white">{event.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {[event.city, event.state].filter(Boolean).join(", ")} • {new Date(event.start_at).toLocaleString()}
                      </div>
                    </span>
                  </label>
                );
              })}
              {eventsAtLimit ? (
                <div className="rounded-[22px] border border-[#A259FF]/20 bg-[#A259FF]/10 p-4 text-sm text-[#eadcff]">
                  {planConfig.label} plan limit reached. Upgrade to add more active events.
                </div>
              ) : null}
              {!payload.availableEvents.length ? (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                  No eligible published events were found for this editor yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Featured crew</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Connect tonight&apos;s talent to the page.</h2>
            <div className="mt-5 grid gap-3">
              {payload.availableCrew.map((member) => {
                const checked = draft.featuredCrewIds.includes(member.id);
                const role = member.custom_category || member.category;
                return (
                  <label key={member.id} className={`flex items-start gap-3 rounded-[22px] border p-4 transition ${checked ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/10 bg-black/20"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          featuredCrewIds: checked
                            ? draft.featuredCrewIds.filter((id: string) => id !== member.id)
                            : [...draft.featuredCrewIds, member.id],
                        })
                      }
                      className="mt-1 h-4 w-4 accent-[#A259FF]"
                    />
                    <span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{member.display_name}</span>
                        {member.availability_state === "available" ? (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                            Available now
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {role} • {[member.city, member.state].filter(Boolean).join(", ") || "Flexible"}
                      </div>
                    </span>
                  </label>
                );
              })}
              {!payload.availableCrew.length ? (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                  No published crew profiles were found for this market yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Monetization setup</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="ev-field" value={`${planConfig.label} · ${planConfig.priceLabel}`} readOnly />
              <input className="ev-field" placeholder="Monthly price USD" value={draft.monthlyPriceUsd} readOnly />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className={`rounded-full border px-4 py-3 text-sm font-semibold ${payload.featureMatrix.leadCaptureUnlocked ? "border-white/10 bg-black/20 text-white/80" : "border-white/10 bg-black/10 text-white/45"}`}>
                <input type="checkbox" checked={draft.emailCaptureEnabled} disabled={!payload.featureMatrix.leadCaptureUnlocked} onChange={(event) => {
                  if (!requirePlan("pro", "Upgrade to Pro to unlock lead capture.")) return;
                  setDraft({ ...draft, emailCaptureEnabled: event.target.checked });
                }} className="mr-2 accent-[#A259FF]" />
                Email capture enabled
              </label>
              <label className={`rounded-full border px-4 py-3 text-sm font-semibold ${payload.featureMatrix.advancedToolsUnlocked ? "border-white/10 bg-black/20 text-white/80" : "border-white/10 bg-black/10 text-white/45"}`}>
                <input type="checkbox" checked={draft.feeBearingEnabled} disabled={!payload.featureMatrix.advancedToolsUnlocked} onChange={(event) => {
                  if (!requirePlan("elite", "Upgrade to Elite to unlock priority placement and advanced tools.")) return;
                  setDraft({ ...draft, feeBearingEnabled: event.target.checked });
                }} className="mr-2 accent-[#A259FF]" />
                Advanced tools ready
              </label>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className={`rounded-[22px] border p-4 text-sm ${payload.featureMatrix.leadCaptureUnlocked ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-black/20 text-white/55"}`}>Lead capture {payload.featureMatrix.leadCaptureUnlocked ? "unlocked" : "locked"}</div>
              <div className={`rounded-[22px] border p-4 text-sm ${payload.featureMatrix.advancedAnalyticsUnlocked ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-black/20 text-white/55"}`}>Advanced analytics {payload.featureMatrix.advancedAnalyticsUnlocked ? "unlocked" : "locked"}</div>
              <div className={`rounded-[22px] border p-4 text-sm ${payload.featureMatrix.advancedToolsUnlocked ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-black/20 text-white/55"}`}>Priority + tools {payload.featureMatrix.advancedToolsUnlocked ? "unlocked" : "locked"}</div>
            </div>
          </section>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={saving} className="ev-button-primary">
          {saving ? "Saving..." : "Save EVNTSZN Link"}
        </button>
        <a href={`/${draft.slug}`} target="_blank" rel="noreferrer" className="ev-button-secondary">
          Open public page
        </a>
      </div>
    </div>
  );
}
