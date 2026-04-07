import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");

  const id = request.nextUrl.searchParams.get("id");
  const query = supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data, error } = id ? await query.eq("id", id).limit(1) : await query.limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}

export async function PATCH(request: Request) {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const payload: Record<string, unknown> = {};
  if ("status" in body) payload.status = String(body.status || "");
  if ("notes" in body) payload.notes = String(body.notes || "").trim() || null;

  const { error } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .update(payload)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
