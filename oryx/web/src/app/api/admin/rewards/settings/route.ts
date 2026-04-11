import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function GET() {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("merch_reward_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function POST(request: Request) {
  const allowed = await isAdminAuthorized();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const payload = {
    id: 1,
    points_per_dollar: Number(body.points_per_dollar || 1),
    first_order_bonus: Number(body.first_order_bonus || 0),
    redemption_enabled: Boolean(body.redemption_enabled),
    redemption_value_cents: Number(body.redemption_value_cents || 100),
    minimum_points_to_redeem: Number(body.minimum_points_to_redeem || 100),
    assigned_manager_user_id: body.assigned_manager_user_id ? String(body.assigned_manager_user_id) : null,
  };

  const { error } = await supabaseAdmin
    .from("merch_reward_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
