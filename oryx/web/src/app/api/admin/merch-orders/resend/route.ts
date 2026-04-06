import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type PrintfulOrderResponse = {
  result?: {
    id?: number | string | null;
  } | null;
};

export async function POST(request: Request) {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = (await request.json()) as { orderId?: string };

    const { data: order, error } = await supabaseAdmin
      .from("merch_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const printfulRes = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          name: order.recipient_name,
          address1: order.address1,
          address2: order.address2 || "",
          city: order.city,
          state_code: order.state_code,
          country_code: order.country_code,
          zip: order.zip,
          email: order.customer_email || "",
        },
        items: [
          {
            sync_variant_id: order.printful_variant_id,
            quantity: order.quantity,
          },
        ],
      }),
    });

    const printfulData = (await printfulRes.json()) as PrintfulOrderResponse;

    if (!printfulRes.ok) {
      await supabaseAdmin
        .from("merch_orders")
        .update({
          fulfillment_status: "failed",
          fulfillment_attempts: (order.fulfillment_attempts || 0) + 1,
          printful_order_data: printfulData,
        })
        .eq("id", orderId);

      return NextResponse.json({ error: "Resend failed" }, { status: 500 });
    }

    await supabaseAdmin
      .from("merch_orders")
      .update({
        fulfillment_status: "sent",
        fulfillment_attempts: (order.fulfillment_attempts || 0) + 1,
        printful_order_id: printfulData?.result?.id ?? null,
        printful_order_data: printfulData,
      })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resend failed" },
      { status: 500 }
    );
  }
}
