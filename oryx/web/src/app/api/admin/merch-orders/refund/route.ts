import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await request.json();

    const { data: order, error } = await supabaseAdmin
      .from("merch_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: "No payment intent found" }, { status: 400 });
    }

    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    await supabaseAdmin
      .from("merch_orders")
      .update({
        status: "refunded",
        refund_amount: order.amount_total,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refund failed" },
      { status: 500 }
    );
  }
}
