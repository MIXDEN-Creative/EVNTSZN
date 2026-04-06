import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_admin_sponsor_deliverables")
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deliverables: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();

  const payload = {
    sponsor_partner_id: body.sponsorPartnerId,
    season_id: body.seasonId || null,
    deliverable_title: body.deliverableTitle,
    deliverable_type: body.deliverableType,
    due_at: body.dueAt || null,
    completed_at: body.completedAt || null,
    status: body.status || "pending",
    owner_assignment_id: body.ownerAssignmentId || null,
    notes: body.notes || null,
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("sponsor_deliverables")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("sponsor_deliverables").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
