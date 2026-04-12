import Stripe from "stripe";
import { LINK_PLANS, normalizeLinkPlan, type LinkPlan } from "@/lib/platform-products";

export const LINK_SUBSCRIPTION_PLANS = LINK_PLANS.filter((plan) => plan !== "free");

const PRICE_ENV_KEYS: Record<Exclude<LinkPlan, "free">, string> = {
  starter: "STRIPE_LINK_STARTER_PRICE_ID",
  pro: "STRIPE_LINK_PRO_PRICE_ID",
  elite: "STRIPE_LINK_ELITE_PRICE_ID",
};

export function getLinkPlanPriceId(plan: Exclude<LinkPlan, "free">) {
  return process.env[PRICE_ENV_KEYS[plan]] || "";
}

export function getLinkBillingCatalog() {
  return LINK_SUBSCRIPTION_PLANS.map((plan) => ({
    plan,
    priceId: getLinkPlanPriceId(plan),
  }));
}

export function getLinkPlanFromStripePriceId(priceId: string | null | undefined): LinkPlan | null {
  if (!priceId) return null;
  for (const plan of LINK_SUBSCRIPTION_PLANS) {
    if (getLinkPlanPriceId(plan) === priceId) {
      return plan;
    }
  }
  return null;
}

export function getLinkPlanFromSubscription(subscription: Stripe.Subscription): LinkPlan {
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id || null;
  return getLinkPlanFromStripePriceId(priceId) || normalizeLinkPlan(subscription.metadata?.link_plan);
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status | null | undefined) {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "past_due";
    default:
      return "inactive";
  }
}
