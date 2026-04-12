import crypto from "node:crypto";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const LINK_ATTRIBUTION_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;
export const LINK_CLICK_COOKIE = "evntszn_link_click";

export function buildLinkClickFingerprint(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

export function parseLinkClickCookie(value: string | undefined | null) {
  if (!value) return null;
  const [clickId, eventId, stampedAt] = value.split(".");
  if (!clickId || !eventId || !stampedAt) return null;
  const clickedAt = Number(stampedAt);
  if (!Number.isFinite(clickedAt)) return null;
  return { clickId, eventId, clickedAt };
}

export function serializeLinkClickCookie(input: { clickId: string; eventId: string; clickedAt: number }) {
  return `${input.clickId}.${input.eventId}.${input.clickedAt}`;
}

export async function attributeLinkConversionFromOrder(input: {
  orderId: string;
  eventId: string;
  purchaserUserId?: string | null;
  amountTotalCents: number;
  quantity: number;
  convertedAt?: string;
  metadata?: Record<string, unknown>;
  checkoutSession?: Stripe.Checkout.Session | null;
}) {
  const convertedAt = input.convertedAt || new Date().toISOString();
  const metadata = input.metadata || {};
  const sessionMetadata = input.checkoutSession?.metadata || {};
  const directClickId = sessionMetadata.evntszn_link_click_id || null;
  const directSessionKey = sessionMetadata.evntszn_link_session_key || null;
  const clickEventId = sessionMetadata.evntszn_link_event_id || input.eventId;
  let attributionStatus: "attributed" | "unattributed" | "expired" | "ambiguous" | "mismatch" = "unattributed";
  let attributionMethod: string | null = null;
  let matchedClick: {
    id: string;
    link_page_id: string;
    link_owner_user_id: string | null;
    created_at: string;
  } | null = null;

  if (directClickId) {
    const { data } = await supabaseAdmin
      .from("evntszn_link_event_clicks")
      .select("id, link_page_id, link_owner_user_id, created_at, event_id")
      .eq("id", directClickId)
      .maybeSingle();
    if (data) {
      if (data.event_id !== clickEventId) {
        attributionStatus = "mismatch";
        attributionMethod = "direct_click_id_mismatch";
      } else if (new Date(convertedAt).getTime() - new Date(data.created_at).getTime() > LINK_ATTRIBUTION_WINDOW_MS) {
        attributionStatus = "expired";
        attributionMethod = "direct_click_id_expired";
      } else {
        matchedClick = data;
        attributionStatus = "attributed";
        attributionMethod = "direct_click_id";
      }
    }
  }

  if (!matchedClick && attributionStatus === "unattributed" && (input.purchaserUserId || directSessionKey)) {
    let query = supabaseAdmin
      .from("evntszn_link_event_clicks")
      .select("id, link_page_id, link_owner_user_id, created_at")
      .eq("event_id", input.eventId)
      .gte("created_at", new Date(new Date(convertedAt).getTime() - LINK_ATTRIBUTION_WINDOW_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(5);

    if (input.purchaserUserId) {
      query = query.eq("clicked_by_user_id", input.purchaserUserId);
    } else if (directSessionKey) {
      query = query.eq("session_key", directSessionKey);
    }

    const { data: candidates } = await query;
    if ((candidates || []).length === 1) {
      matchedClick = candidates![0];
      attributionStatus = "attributed";
      attributionMethod = input.purchaserUserId ? "recent_user_click" : "recent_session_click";
    } else if ((candidates || []).length > 1) {
      matchedClick = candidates![0];
      attributionStatus = "attributed";
      attributionMethod = input.purchaserUserId ? "latest_user_click" : "latest_session_click";
      metadata.multipleCandidates = (candidates || []).map((candidate) => candidate.id);
    }
  }

  const conversionPayload = {
    link_page_id: matchedClick?.link_page_id || null,
    link_click_id: matchedClick?.id || null,
    link_owner_user_id: matchedClick?.link_owner_user_id || null,
    event_id: input.eventId,
    ticket_order_id: input.orderId,
    purchaser_user_id: input.purchaserUserId || null,
    attributed_order_count: attributionStatus === "attributed" ? 1 : 0,
    attributed_ticket_count: attributionStatus === "attributed" ? input.quantity : 0,
    attributed_gross_revenue_cents: attributionStatus === "attributed" ? input.amountTotalCents : 0,
    attribution_status: attributionStatus,
    attribution_method: attributionMethod,
    clicked_at: matchedClick?.created_at || null,
    converted_at: convertedAt,
    metadata,
  };

  const { error } = await supabaseAdmin
    .from("evntszn_link_conversions")
    .upsert(conversionPayload, { onConflict: "ticket_order_id" });

  if (error) {
    throw new Error(error.message);
  }
}
