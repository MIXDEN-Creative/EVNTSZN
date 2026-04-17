import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const [
    playerPipelineRes,
    staffPipelineRes,
    revenueRes,
    opportunitiesRes,
    rolesRes,
    sponsorsRes,
    merchRes,
    addOnsRes,
  ] = await Promise.all([
    supabase.from("epl_v_player_pipeline").select("*").eq("season_slug", seasonSlug).order("submitted_at", { ascending: false }),
    supabase.from("epl_v_staff_pipeline").select("*").eq("season_slug", seasonSlug).order("created_at", { ascending: false }),
    supabase.from("epl_v_revenue_pipeline_summary").select("*").eq("season_slug", seasonSlug).order("stream_code"),
    supabase.from("epl_v_public_opportunities").select("*").order("display_order", { ascending: true }),
    supabase.from("epl_v_staff_roles_catalog").select("*"),
    supabase.from("epl_v_sponsor_partners").select("*").eq("season_slug", seasonSlug),
    supabase.from("epl_v_merch_catalog").select("*").eq("season_slug", seasonSlug),
    supabase.from("epl_v_add_on_catalog").select("*").eq("season_slug", seasonSlug),
  ]);

  const error =
    playerPipelineRes.error ||
    staffPipelineRes.error ||
    revenueRes.error ||
    opportunitiesRes.error ||
    rolesRes.error ||
    sponsorsRes.error ||
    merchRes.error ||
    addOnsRes.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    playerPipeline: playerPipelineRes.data || [],
    staffPipeline: staffPipelineRes.data || [],
    revenueSummary: revenueRes.data || [],
    opportunities: opportunitiesRes.data || [],
    roles: rolesRes.data || [],
    sponsors: sponsorsRes.data || [],
    merch: merchRes.data || [],
    addOns: addOnsRes.data || [],
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();
  const action = body.action;

  if (action === "updatePlayerPipeline") {
    const { error } = await supabase.rpc("epl_set_player_pipeline_status", {
      p_application_id: body.applicationId,
      p_application_status: body.applicationStatus ?? null,
      p_registration_status: body.registrationStatus ?? null,
      p_draft_eligible: body.draftEligible ?? null,
      p_player_status: body.playerStatus ?? null,
      p_waived_fee: body.waivedFee ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "assignStaff") {
    const { error } = await supabase.rpc("epl_create_staff_assignment", {
      p_staff_application_id: body.staffApplicationId,
      p_role_id: body.roleId,
      p_compensation_tier: body.compensationTier,
      p_pay_rate_usd: body.payRateUsd ?? null,
      p_stipend_usd: body.stipendUsd ?? null,
      p_can_access_admin: !!body.canAccessAdmin,
      p_can_access_draft_console: !!body.canAccessDraftConsole,
      p_can_access_scanner: !!body.canAccessScanner,
      p_can_access_finance: !!body.canAccessFinance,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "createOpportunity") {
    const { error } = await supabase.rpc("epl_create_opportunity", {
      p_role_code: body.roleCode,
      p_title: body.title,
      p_department: body.department,
      p_opportunity_type: body.opportunityType,
      p_summary: body.summary,
      p_description: body.description,
      p_requirements: body.requirements || [],
      p_perks: body.perks || [],
      p_pay_label: body.payLabel ?? null,
      p_display_order: body.displayOrder ?? 100,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "createRevenueEntry") {
    const { error } = await supabase.rpc("epl_create_revenue_entry", {
      p_season_slug: body.seasonSlug,
      p_stream_code: body.streamCode,
      p_money_direction: body.moneyDirection,
      p_amount_usd: body.amountUsd,
      p_memo: body.memo ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "createSponsor") {
    const { error } = await supabase.rpc("epl_create_sponsor_partner", {
      p_season_slug: body.seasonSlug,
      p_company_name: body.companyName,
      p_contact_name: body.contactName ?? null,
      p_contact_email: body.contactEmail ?? null,
      p_package_name: body.packageName ?? null,
      p_cash_value_usd: body.cashValueUsd ?? 0,
      p_in_kind_value_usd: body.inKindValueUsd ?? 0,
      p_notes: body.notes ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "createMerch") {
    const { error } = await supabase.rpc("epl_create_merch_item", {
      p_season_slug: body.seasonSlug,
      p_sku: body.sku,
      p_item_name: body.itemName,
      p_item_type: body.itemType,
      p_price_usd: body.priceUsd,
      p_cost_usd: body.costUsd ?? 0,
      p_inventory_count: body.inventoryCount ?? 0,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "createAddOn") {
    const { error } = await supabase.rpc("epl_create_add_on", {
      p_season_slug: body.seasonSlug,
      p_code: body.code,
      p_item_name: body.itemName,
      p_description: body.description ?? null,
      p_price_usd: body.priceUsd ?? 0,
      p_fulfillment_type: body.fulfillmentType ?? "digital",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
