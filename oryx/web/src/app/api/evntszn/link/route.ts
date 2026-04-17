import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPlatformViewer } from "@/lib/evntszn";
import { LINK_PLAN_CONFIG, normalizeLinkPlan, safeJsonArray, slugify, type LinkPlan } from "@/lib/platform-products";

type LinkPagePayload = {
  slug?: string;
  displayName?: string;
  headline?: string;
  intro?: string;
  city?: string;
  state?: string;
  profileImageUrl?: string;
  primaryEmail?: string;
  accentLabel?: string;
  status?: "draft" | "published";
  feeBearingEnabled?: boolean;
  monthlyPriceUsd?: number | null;
  emailCaptureEnabled?: boolean;
  socialLinks?: Array<{ platform?: string; label?: string; url?: string }>;
  offers?: Array<{ offerType?: string; title?: string; description?: string; href?: string; ctaLabel?: string; priceLabel?: string; feeAmountUsd?: number | null }>;
  featuredEventIds?: string[];
  featuredCrewIds?: string[];
};

type LinkBlockedFeature =
  | "branding"
  | "event_limit"
  | "lead_capture"
  | "funnel_pages"
  | "advanced_tools";

function blockedResponse(input: {
  code: string;
  blockedFeature: LinkBlockedFeature;
  requiredPlan: LinkPlan;
  currentPlan: LinkPlan;
  message: string;
}) {
  return NextResponse.json(
    {
      error: input.message,
      code: input.code,
      blockedFeature: input.blockedFeature,
      requiredPlan: input.requiredPlan,
      currentPlan: input.currentPlan,
    },
    { status: 403 },
  );
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user;
}

async function buildUniqueSlug(baseInput: string, userId: string, currentPageId?: string) {
  const base = slugify(baseInput) || `link-${userId.slice(0, 8)}`;

  for (let index = 0; index < 12; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const [linkRes, crewRes] = await Promise.all([
      supabaseAdmin
        .from("evntszn_link_pages")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle(),
      supabaseAdmin
        .from("evntszn_crew_profiles")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle(),
    ]);
    if (linkRes.error) {
      throw new Error(linkRes.error.message);
    }
    if (crewRes.error) {
      throw new Error(crewRes.error.message);
    }
    const linkOwnsCandidate = !linkRes.data || linkRes.data.id === currentPageId;
    if (linkOwnsCandidate && !crewRes.data) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString().slice(-4)}`;
}

async function ensureLinkPageForUser(user: { id: string; email?: string | null }) {
  const viewer = await getPlatformViewer();
  const displayName =
    viewer.profile?.full_name ||
    viewer.user?.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "EVNTSZN Curator";

  const existingRes = await supabaseAdmin
    .from("evntszn_link_pages")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRes.error) {
    throw new Error(existingRes.error.message);
  }

  if (existingRes.data) {
    return existingRes.data;
  }

  const slug = await buildUniqueSlug(displayName, user.id);
  const { data, error } = await supabaseAdmin
    .from("evntszn_link_pages")
    .insert({
      user_id: user.id,
      slug,
      display_name: displayName,
      headline: "Build the night before guests ever arrive.",
      intro: "Use EVNTSZN Link to direct your audience into the right event, offer, or contact lane.",
      primary_email: user.email || null,
      city: viewer.profile?.city || null,
      state: viewer.profile?.state || null,
      accent_label: "Curator conversion page",
      status: "draft",
      plan_tier: "free",
      email_capture_enabled: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function buildFeatureMatrix(plan: LinkPlan) {
  const config = LINK_PLAN_CONFIG[plan];
  return {
    plan,
    currentPlanLabel: config.label,
    maxActiveEvents: config.maxActiveEvents,
    brandingEnforced: config.brandingEnforced,
    leadCaptureUnlocked: config.leadCapture,
    funnelPagesUnlocked: config.funnelPages,
    advancedAnalyticsUnlocked: config.advancedAnalytics,
    priorityPlacementUnlocked: config.priorityPlacement,
    advancedToolsUnlocked: config.advancedTools,
  };
}

function buildOnboarding(page: {
  slug: string | null;
  status: string | null;
}, socialLinks: Array<{ url?: string | null }>, featuredEventIds: string[]) {
  const hasPage = Boolean(page.slug);
  const hasSocials = socialLinks.some((item) => Boolean(String(item.url || "").trim()));
  const hasEvent = featuredEventIds.length > 0;
  const isPublished = page.status === "published";
  const steps = [
    {
      key: "create_page",
      label: "Create your page",
      complete: hasPage,
      detail: hasPage ? "Your EVNTSZN Link URL is ready." : "Set the basics for your public page.",
    },
    {
      key: "add_event",
      label: "Add your first event",
      complete: hasEvent,
      detail: hasEvent ? "Your Link is pushing at least one live event." : "Attach an active event to start routing traffic.",
    },
    {
      key: "add_socials",
      label: "Add your social links",
      complete: hasSocials,
      detail: hasSocials ? "Your socials are directing traffic into the page." : "Add social lanes so the page becomes your traffic hub.",
    },
    {
      key: "publish_share",
      label: "Publish and share your link",
      complete: isPublished,
      detail: isPublished ? "Your page is live and ready to share." : "Publish the page so people can start landing on it.",
    },
  ];

  const nextStep = steps.find((step) => !step.complete) || null;
  return {
    completedCount: steps.filter((step) => step.complete).length,
    totalCount: steps.length,
    complete: steps.every((step) => step.complete),
    nextStep,
    steps,
  };
}

async function loadEditorPayload(userId: string) {
  const pageRes = await supabaseAdmin
    .from("evntszn_link_pages")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (pageRes.error) {
    throw new Error(pageRes.error.message);
  }

  const page = pageRes.data;
  const [socialRes, offersRes, pinnedRes, ownEventsRes, fallbackEventsRes, crewRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_link_social_links")
      .select("*")
      .eq("link_page_id", page.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_link_offers")
      .select("*")
      .eq("link_page_id", page.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_link_event_links")
      .select("event_id, sort_order")
      .eq("link_page_id", page.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_events")
      .select("id, title, slug, city, state, start_at, visibility, status")
      .eq("organizer_user_id", userId)
      .eq("visibility", "published")
      .eq("status", "published")
      .gte("start_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString())
      .order("start_at", { ascending: true })
      .limit(12),
    supabaseAdmin
      .from("evntszn_events")
      .select("id, title, slug, city, state, start_at, visibility, status")
      .eq("visibility", "published")
      .eq("status", "published")
      .gte("start_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString())
      .order("start_at", { ascending: true })
      .limit(18),
    supabaseAdmin
      .from("evntszn_crew_profiles")
      .select("id, display_name, slug, category, custom_category, city, state, availability_state, status")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(18),
  ]);

  if (socialRes.error) throw new Error(socialRes.error.message);
  if (offersRes.error) throw new Error(offersRes.error.message);
  if (pinnedRes.error) throw new Error(pinnedRes.error.message);
  if (ownEventsRes.error) throw new Error(ownEventsRes.error.message);
  if (fallbackEventsRes.error) throw new Error(fallbackEventsRes.error.message);
  if (crewRes.error) throw new Error(crewRes.error.message);

  const viewer = await getPlatformViewer();
  const cityScopes = viewer.operatorProfile?.city_scope || [];
  const profileCity = viewer.profile?.city || null;
  const availableEvents = [...(ownEventsRes.data || []), ...(fallbackEventsRes.data || [])].filter((event, index, rows) => {
    if (rows.findIndex((entry) => entry.id === event.id) !== index) return false;
    if (event.city && cityScopes.length) {
      return cityScopes.map((entry) => entry.toLowerCase()).includes(String(event.city).toLowerCase());
    }
    if (profileCity && event.city) {
      return String(event.city).toLowerCase() === profileCity.toLowerCase();
    }
    return true;
  });

  const availableCrew = (crewRes.data || []).filter((profile) => {
    if (profile.city && cityScopes.length) {
      return cityScopes.map((entry) => entry.toLowerCase()).includes(String(profile.city).toLowerCase());
    }
    if (profile.city && profileCity) {
      return String(profile.city).toLowerCase() === profileCity.toLowerCase();
    }
    return true;
  });

  const metadata = page.metadata && typeof page.metadata === "object" ? page.metadata : {};
  const featuredCrewIds = safeJsonArray((metadata as { featuredCrewIds?: unknown }).featuredCrewIds);
  const normalizedPlan = normalizeLinkPlan(page.plan_tier);
  const featureMatrix = buildFeatureMatrix(normalizedPlan);
  const featuredEventIds = (pinnedRes.data || []).map((row) => row.event_id).slice(0, featureMatrix.maxActiveEvents);
  const [leadCountRes, clickCountRes, clickRowsRes, conversionRowsRes, ticketRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_link_leads")
      .select("id", { count: "exact", head: true })
      .eq("link_page_id", page.id),
    supabaseAdmin
      .from("evntszn_link_event_clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_page_id", page.id),
    supabaseAdmin
      .from("evntszn_link_event_clicks")
      .select("id, event_id, session_key, click_fingerprint, created_at")
      .eq("link_page_id", page.id)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabaseAdmin
      .from("evntszn_link_conversions")
      .select("id, event_id, attributed_order_count, attributed_ticket_count, attributed_gross_revenue_usd, attribution_status, attribution_method, converted_at, evntszn_events:event_id(title, slug)")
      .eq("link_page_id", page.id)
      .order("converted_at", { ascending: false })
      .limit(200),
    featuredEventIds.length
      ? supabaseAdmin
          .from("evntszn_ticket_types")
          .select("event_id, quantity_sold")
          .in("event_id", featuredEventIds)
      : Promise.resolve({ data: [] as Array<{ event_id: string; quantity_sold: number | null }>, error: null }),
  ]);
  if (leadCountRes.error) throw new Error(leadCountRes.error.message);
  if (clickCountRes.error) throw new Error(clickCountRes.error.message);
  if (clickRowsRes.error) throw new Error(clickRowsRes.error.message);
  if (conversionRowsRes.error) throw new Error(conversionRowsRes.error.message);
  if (ticketRes.error) throw new Error(ticketRes.error.message);
  const viewCount = Number((metadata as { view_count?: unknown }).view_count || 0);
  const totalGoing = (ticketRes.data || []).reduce((sum, row) => sum + Number(row.quantity_sold || 0), 0);
  const onboarding = buildOnboarding(page, socialRes.data || [], featuredEventIds);
  const uniqueClickKeys = new Set(
    (clickRowsRes.data || []).map((row) => row.session_key || row.click_fingerprint || row.id),
  );
  const attributedConversions = (conversionRowsRes.data || []).filter((row) => row.attribution_status === "attributed");
  const attributedOrderCount = attributedConversions.reduce((sum, row) => sum + Number(row.attributed_order_count || 0), 0);
  const attributedTicketCount = attributedConversions.reduce((sum, row) => sum + Number(row.attributed_ticket_count || 0), 0);
  const attributedGrossRevenueUsd = attributedConversions.reduce((sum, row) => sum + Number(row.attributed_gross_revenue_usd || 0), 0);
  const eventPerformance = new Map<string, {
    eventId: string;
    title: string;
    slug: string;
    clicks: number;
    orders: number;
    tickets: number;
    grossRevenueUsd: number;
  }>();
  for (const click of clickRowsRes.data || []) {
    const current = eventPerformance.get(click.event_id) || {
      eventId: click.event_id,
      title: "Linked event",
      slug: "",
      clicks: 0,
      orders: 0,
      tickets: 0,
      grossRevenueUsd: 0,
    };
    current.clicks += 1;
    eventPerformance.set(click.event_id, current);
  }
  for (const conversion of attributedConversions) {
    const eventRow = Array.isArray(conversion.evntszn_events) ? conversion.evntszn_events[0] : conversion.evntszn_events;
    const current = eventPerformance.get(conversion.event_id) || {
      eventId: conversion.event_id,
      title: eventRow?.title || "Linked event",
      slug: eventRow?.slug || "",
      clicks: 0,
      orders: 0,
      tickets: 0,
      grossRevenueUsd: 0,
    };
    current.title = eventRow?.title || current.title;
    current.slug = eventRow?.slug || current.slug;
    current.orders += Number(conversion.attributed_order_count || 0);
    current.tickets += Number(conversion.attributed_ticket_count || 0);
    current.grossRevenueUsd += Number(conversion.attributed_gross_revenue_usd || 0);
    eventPerformance.set(conversion.event_id, current);
  }
  const topEvents = [...eventPerformance.values()]
    .sort((left, right) => {
      if (right.grossRevenueUsd !== left.grossRevenueUsd) return right.grossRevenueUsd - left.grossRevenueUsd;
      if (right.orders !== left.orders) return right.orders - left.orders;
      return right.clicks - left.clicks;
    })
    .slice(0, 5);
  const recentConversions = attributedConversions.slice(0, 6).map((conversion) => {
    const eventRow = Array.isArray(conversion.evntszn_events) ? conversion.evntszn_events[0] : conversion.evntszn_events;
    return {
      id: conversion.id,
      eventTitle: eventRow?.title || "Linked event",
      eventSlug: eventRow?.slug || "",
      convertedAt: conversion.converted_at,
      orderCount: Number(conversion.attributed_order_count || 0),
      ticketCount: Number(conversion.attributed_ticket_count || 0),
      grossRevenueUsd: Number(conversion.attributed_gross_revenue_usd || 0),
      attributionMethod: conversion.attribution_method || "deterministic",
    };
  });
  const uniqueClicks = uniqueClickKeys.size;
  const conversionRate = uniqueClicks > 0 ? Math.round((attributedOrderCount / uniqueClicks) * 1000) / 10 : null;

  return {
    page: {
      ...page,
      plan_tier: normalizedPlan,
      email_capture_enabled: featureMatrix.leadCaptureUnlocked ? page.email_capture_enabled : false,
      accent_label: featureMatrix.brandingEnforced ? "Powered by EVNTSZN" : page.accent_label,
    },
    socialLinks: socialRes.data || [],
    offers: featureMatrix.funnelPagesUnlocked ? offersRes.data || [] : [],
    featuredEventIds,
    featuredCrewIds,
    availableEvents,
    availableCrew,
    usage: {
      eventsUsed: featuredEventIds.length,
      eventLimit: featureMatrix.maxActiveEvents,
      viewCount,
      leadCount: leadCountRes.count || 0,
      totalGoing,
      totalClicks: clickCountRes.count || 0,
      uniqueClicks,
      attributedOrderCount,
      attributedTicketCount,
      attributedGrossRevenueUsd,
      conversionRate,
    },
    featureMatrix,
    billing: {
      status: page.subscription_status || "inactive",
      hasSubscription: Boolean(page.stripe_subscription_id),
    },
    onboarding,
    performance: {
      topEvents,
      recentConversions,
    },
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLinkPageForUser(user);
    const payload = await loadEditorPayload(user.id);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load EVNTSZN Link." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPage = await ensureLinkPageForUser(user);
    const body = (await request.json().catch(() => ({}))) as LinkPagePayload;
    const currentPlan = normalizeLinkPlan(existingPage.plan_tier);
    const featureMatrix = buildFeatureMatrix(currentPlan);
    const requestedEventIds = safeJsonArray(body.featuredEventIds);
    const requestedOffers = Array.isArray(body.offers) ? body.offers : [];
    const requestedSocialLinks = Array.isArray(body.socialLinks) ? body.socialLinks : [];

    if (featureMatrix.brandingEnforced) {
      const requestedAccentLabel = String(body.accentLabel || "").trim();
      if (requestedAccentLabel && requestedAccentLabel !== "Powered by EVNTSZN") {
        return blockedResponse({
          code: "link_branding_locked",
          blockedFeature: "branding",
          requiredPlan: "starter",
          currentPlan,
          message: "Branding is locked on Free. Upgrade to Starter to remove EVNTSZN branding.",
        });
      }
    }

    if (requestedEventIds.length > featureMatrix.maxActiveEvents) {
      return blockedResponse({
        code: "link_event_limit_reached",
        blockedFeature: "event_limit",
        requiredPlan: currentPlan === "free" ? "starter" : currentPlan,
        currentPlan,
        message: `Your ${LINK_PLAN_CONFIG[currentPlan].label} plan allows ${featureMatrix.maxActiveEvents} active event link${featureMatrix.maxActiveEvents === 1 ? "" : "s"}. Upgrade to add more.`,
      });
    }

    if (body.emailCaptureEnabled && !featureMatrix.leadCaptureUnlocked) {
      return blockedResponse({
        code: "link_lead_capture_locked",
        blockedFeature: "lead_capture",
        requiredPlan: "pro",
        currentPlan,
        message: "Lead capture is locked on your current plan. Upgrade to Pro to turn visits into signups.",
      });
    }

    if (requestedOffers.length > 0 && !featureMatrix.funnelPagesUnlocked) {
      return blockedResponse({
        code: "link_funnel_pages_locked",
        blockedFeature: "funnel_pages",
        requiredPlan: "pro",
        currentPlan,
        message: "Offers and funnel sections are locked on your current plan. Upgrade to Pro to unlock them.",
      });
    }

    if (body.feeBearingEnabled && !featureMatrix.advancedToolsUnlocked) {
      return blockedResponse({
        code: "link_advanced_tools_locked",
        blockedFeature: "advanced_tools",
        requiredPlan: "elite",
        currentPlan,
        message: "Advanced optimization controls are reserved for Elite. Upgrade to unlock them.",
      });
    }

    const filteredOffers = requestedOffers;
    const nextMetadata = {
      ...((existingPage.metadata && typeof existingPage.metadata === "object" ? existingPage.metadata : {}) as Record<string, unknown>),
      featuredCrewIds: safeJsonArray(body.featuredCrewIds),
      priorityPlacementEnabled: featureMatrix.priorityPlacementUnlocked,
      abTestingEnabled: featureMatrix.advancedToolsUnlocked,
      crmLiteEnabled: featureMatrix.advancedToolsUnlocked,
    };
    const nextSlug = await buildUniqueSlug(
      body.slug || body.displayName || existingPage.display_name || user.email?.split("@")[0] || "link",
      user.id,
      existingPage.id,
    );

    const { error: pageError } = await supabaseAdmin
      .from("evntszn_link_pages")
      .update({
        slug: nextSlug,
        display_name: body.displayName || existingPage.display_name,
        headline: body.headline || null,
        intro: body.intro || null,
        city: body.city || null,
        state: body.state || null,
        profile_image_url: body.profileImageUrl || null,
        primary_email: body.primaryEmail || null,
        accent_label: featureMatrix.brandingEnforced ? "Powered by EVNTSZN" : body.accentLabel || null,
        status: body.status === "published" ? "published" : "draft",
        plan_tier: currentPlan,
        fee_bearing_enabled: featureMatrix.advancedToolsUnlocked ? Boolean(body.feeBearingEnabled) : false,
        monthly_price_usd: body.monthlyPriceUsd ? Number(body.monthlyPriceUsd) : null,
        email_capture_enabled: featureMatrix.leadCaptureUnlocked ? body.emailCaptureEnabled !== false : false,
        metadata: nextMetadata,
      })
      .eq("id", existingPage.id);

    if (pageError) {
      throw new Error(pageError.message);
    }

    await Promise.all([
      supabaseAdmin.from("evntszn_link_social_links").delete().eq("link_page_id", existingPage.id),
      supabaseAdmin.from("evntszn_link_offers").delete().eq("link_page_id", existingPage.id),
      supabaseAdmin.from("evntszn_link_event_links").delete().eq("link_page_id", existingPage.id),
    ]);

    if (requestedSocialLinks.length) {
      const { error } = await supabaseAdmin.from("evntszn_link_social_links").insert(
        requestedSocialLinks
          .filter((item) => item?.url)
          .map((item, index) => ({
            link_page_id: existingPage.id,
            platform: String(item.platform || item.label || "link").trim() || "link",
            label: String(item.label || "").trim() || null,
            url: String(item.url || "").trim(),
            sort_order: index,
          })),
      );
      if (error) throw new Error(error.message);
    }

    if (filteredOffers.length) {
      const { error } = await supabaseAdmin.from("evntszn_link_offers").insert(
        filteredOffers
          .filter((item) => item?.title && item?.href)
          .map((item, index) => ({
            link_page_id: existingPage.id,
            offer_type: String(item.offerType || "custom"),
            title: String(item.title || "").trim(),
            description: String(item.description || "").trim() || null,
            href: String(item.href || "").trim(),
            cta_label: String(item.ctaLabel || "Open").trim() || "Open",
            price_label: String(item.priceLabel || "").trim() || null,
            fee_amount_usd: item.feeAmountUsd ? Number(item.feeAmountUsd) : null,
            is_featured: index === 0,
            sort_order: index,
          })),
      );
      if (error) throw new Error(error.message);
    }

    if (requestedEventIds.length) {
      const { error } = await supabaseAdmin.from("evntszn_link_event_links").insert(
        requestedEventIds.slice(0, featureMatrix.maxActiveEvents).map((eventId, index) => ({
          link_page_id: existingPage.id,
          event_id: eventId,
          sort_order: index,
          is_featured: index < 3,
        })),
      );
      if (error) throw new Error(error.message);
    }

    const payload = await loadEditorPayload(user.id);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save EVNTSZN Link." },
      { status: 500 },
    );
  }
}
