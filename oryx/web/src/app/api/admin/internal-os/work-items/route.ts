import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { createInternalWorkItem } from "@/lib/internal-os";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/control-center");
  const { searchParams } = new URL(request.url);
  const desk = searchParams.get("desk");

  let query = supabaseAdmin
    .from("internal_work_items")
    .select("id, title, description, status, priority, assigned_to, payload, created_at, updated_at, internal_desks(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (desk) {
    const { data: deskRow, error: deskError } = await supabaseAdmin
      .from("internal_desks")
      .select("id")
      .eq("slug", desk)
      .maybeSingle();
    if (deskError) return NextResponse.json({ error: deskError.message }, { status: 500 });
    if (!deskRow?.id) return NextResponse.json({ items: [] });
    query = query.eq("desk_id", deskRow.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/control-center");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const deskSlug = String(body.deskSlug || "").trim();
  const title = String(body.title || "").trim();

  if (!deskSlug || !title) {
    return NextResponse.json({ error: "Desk slug and title are required." }, { status: 400 });
  }

  try {
    const item = await createInternalWorkItem({
      deskSlug: deskSlug as never,
      title,
      description: String(body.description || "").trim() || null,
      priority: (body.priority as "low" | "medium" | "high" | "critical") || "medium",
      assignedTo: String(body.assignedTo || "").trim() || null,
      payload: (body.payload as Record<string, unknown>) || {},
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create work item." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/control-center");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json({ error: "Work item id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) patch.status = String(body.status || "").trim();
  if (body.priority !== undefined) patch.priority = String(body.priority || "").trim();
  if (body.assignedTo !== undefined) patch.assigned_to = String(body.assignedTo || "").trim() || null;
  if (body.description !== undefined) patch.description = String(body.description || "").trim() || null;
  if (body.payload !== undefined) patch.payload = body.payload;

  if (body.founderOverride) {
    const existingPayload =
      (
        await supabaseAdmin
          .from("internal_work_items")
          .select("payload")
          .eq("id", id)
          .maybeSingle()
      ).data?.payload || {};
    patch.payload = {
      ...(existingPayload as Record<string, unknown>),
      founderOverride: true,
      founderOverrideBy: user.id,
      founderOverrideAt: new Date().toISOString(),
      ...(typeof body.payload === "object" && body.payload ? (body.payload as Record<string, unknown>) : {}),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("internal_work_items")
    .update(patch)
    .eq("id", id)
    .select("id, status, priority, assigned_to, payload, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
