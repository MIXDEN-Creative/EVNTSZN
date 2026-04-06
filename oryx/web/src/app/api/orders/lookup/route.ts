import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const orderNumber = String(body.orderNumber || "").trim().toUpperCase();

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: "Email and order number are required." },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from("merch_orders")
      .select(`
        public_order_number,
        created_at,
        customer_name,
        customer_email,
        product_name,
        quantity,
        amount_total,
        status,
        fulfillment_status,
        printful_order_id,
        reward_points_earned
      `)
      .eq("customer_email", email)
      .eq("public_order_number", orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const { data: rewards } = await supabaseAdmin
      .from("merch_reward_accounts")
      .select("lifetime_points, available_points, total_spent, orders_count, tier")
      .eq("customer_email", email)
      .maybeSingle();

    return NextResponse.json({
      order,
      rewards: rewards || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
