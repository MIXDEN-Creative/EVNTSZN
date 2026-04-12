import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/domains";
import { LINK_SUBSCRIPTION_PLANS, getLinkPlanPriceId } from "@/lib/link-billing";
import { normalizeLinkPlan, type LinkPlan } from "@/lib/platform-products";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { plan?: LinkPlan };
    const requestedPlan = normalizeLinkPlan(body.plan);

    if (!LINK_SUBSCRIPTION_PLANS.includes(requestedPlan as Exclude<LinkPlan, "free">)) {
      return NextResponse.json({ error: "Choose a paid EVNTSZN Link plan." }, { status: 400 });
    }

    const priceId = getLinkPlanPriceId(requestedPlan as Exclude<LinkPlan, "free">);
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price is not configured for this plan." }, { status: 500 });
    }

    const { data: linkPage, error: pageError } = await supabaseAdmin
      .from("evntszn_link_pages")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (pageError || !linkPage) {
      return NextResponse.json({ error: pageError?.message || "EVNTSZN Link page not found." }, { status: 404 });
    }

    const requestHost = new URL(request.url).host;
    const baseUrl = getAppOrigin(requestHost);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: linkPage.stripe_customer_id || undefined,
      client_reference_id: user.id,
      success_url: `${baseUrl}/account/link?billing=success`,
      cancel_url: `${baseUrl}/account/link?billing=cancel`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        checkout_kind: "link_subscription",
        user_id: user.id,
        link_page_id: linkPage.id,
        selected_plan: requestedPlan,
      },
      subscription_data: {
        metadata: {
          checkout_kind: "link_subscription",
          user_id: user.id,
          link_page_id: linkPage.id,
          link_plan: requestedPlan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Link checkout." },
      { status: 500 },
    );
  }
}
