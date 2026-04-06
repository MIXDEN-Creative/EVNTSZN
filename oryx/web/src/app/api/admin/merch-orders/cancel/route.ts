import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = (await request.json()) as { orderId?: string };

    await supabaseAdmin
      .from("merch_orders")
      .update({
        status: "canceled",
        fulfillment_status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cancel failed" },
      { status: 500 }
    );
  }
}
