import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST() {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: linkPage, error } = await supabaseAdmin
      .from("evntszn_link_pages")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();
    if (error || !linkPage) {
      return NextResponse.json({ error: error?.message || "EVNTSZN Link page not found." }, { status: 404 });
    }

    if (!linkPage.stripe_subscription_id) {
      await supabaseAdmin
        .from("evntszn_link_pages")
        .update({
          plan_tier: "free",
          subscription_status: "inactive",
        })
        .eq("id", linkPage.id);
      return NextResponse.json({ ok: true });
    }

    await stripe.subscriptions.cancel(linkPage.stripe_subscription_id);

    await supabaseAdmin
      .from("evntszn_link_pages")
      .update({
        plan_tier: "free",
        subscription_status: "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", linkPage.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not cancel EVNTSZN Link subscription." },
      { status: 500 },
    );
  }
}
