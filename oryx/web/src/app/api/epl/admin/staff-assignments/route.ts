import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const [seasonRes, rolesRes, assignmentsRes] = await Promise.all([
    supabase.schema("epl").from("seasons").select("id, name, slug, league_id").eq("slug", seasonSlug).single(),
    supabase.schema("epl").from("staff_roles_catalog").select("*").order("sort_order", { ascending: true }),
    supabase
      .schema("epl")
      .from("season_staff_assignments")
      .select("*, staff_roles_catalog(display_name, role_code)")
      .order("created_at", { ascending: false }),
  ]);

  if (seasonRes.error || rolesRes.error || assignmentsRes.error) {
    return NextResponse.json(
      { error: seasonRes.error?.message || rolesRes.error?.message || assignmentsRes.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    season: seasonRes.data,
    roles: rolesRes.data || [],
    assignments: (assignmentsRes.data || []).filter((a: any) => a.season_id === seasonRes.data.id),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const { data: seasonRow, error: seasonError } = await supabase
    .schema("epl")
    .from("seasons")
    .select("id, league_id")
    .eq("slug", body.seasonSlug || "season-1")
    .single();

  if (seasonError) return NextResponse.json({ error: seasonError.message }, { status: 500 });

  const payload = {
    league_id: seasonRow.league_id,
    season_id: seasonRow.id,
    staff_application_id: body.staffApplicationId || null,
    role_id: body.roleId,
    assignment_status: body.assignmentStatus || "assigned",
    compensation_tier: body.compensationTier || "volunteer",
    pay_rate_usd: body.payRateUsd ? Number(body.payRateUsd) : null,
    stipend_usd: body.stipendUsd ? Number(body.stipendUsd) : null,
    access_scope: body.accessScope || {},
    can_access_admin: !!body.canAccessAdmin,
    can_access_draft_console: !!body.canAccessDraftConsole,
    can_access_scanner: !!body.canAccessScanner,
    can_access_finance: !!body.canAccessFinance,
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("season_staff_assignments")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("season_staff_assignments").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
