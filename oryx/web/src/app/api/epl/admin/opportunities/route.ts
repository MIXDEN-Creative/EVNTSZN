import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { normalizePermissionCodes } from "@/lib/access-control";

export async function GET() {
  await requireAdminPermission("opportunities.manage", "/epl/admin/opportunities");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .schema("epl")
    .from("opportunities")
    .select("*")
    .order("priority_score", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunities: data || [] });
}

export async function POST(req: NextRequest) {
  await requireAdminPermission("opportunities.manage", "/epl/admin/opportunities");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const { data: leagueRow, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id")
    .eq("slug", "epl")
    .single();

  if (leagueError) return NextResponse.json({ error: leagueError.message }, { status: 500 });

  let seasonId: string | null = null;
  if (body.seasonSlug) {
    const { data: seasonRow, error: seasonError } = await supabase
      .schema("epl")
      .from("seasons")
      .select("id")
      .eq("slug", body.seasonSlug)
      .maybeSingle();

    if (seasonError) return NextResponse.json({ error: seasonError.message }, { status: 500 });
    seasonId = seasonRow?.id || null;
  }

  const payload = {
    league_id: leagueRow.id,
    season_id: seasonId,
    role_code: body.roleCode,
    title: body.title,
    department: body.department,
    opportunity_type: body.opportunityType,
    summary: body.summary,
    description: body.description,
    requirements: body.requirements || [],
    perks: body.perks || [],
    pay_label: body.payLabel || null,
    status: body.status || "open",
    is_public: body.isPublic ?? true,
    location_city: body.locationCity || null,
    location_state: body.locationState || null,
    priority_score: Number(body.priorityScore || 100),
    display_order: Number(body.displayOrder || 100),
    access_role_id: body.accessRoleId || null,
    assignment_permission_codes: normalizePermissionCodes(body.assignmentPermissionCodes),
    assignment_logic: typeof body.assignmentLogic === "string" && body.assignmentLogic.trim()
      ? { notes: body.assignmentLogic.trim() }
      : typeof body.assignmentLogic === "object" && body.assignmentLogic !== null
        ? body.assignmentLogic
        : {},
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("opportunities")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("opportunities").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
