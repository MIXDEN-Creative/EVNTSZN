import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type AllowedTable =
  | "opportunities"
  | "sponsor_partners"
  | "merch_catalog"
  | "add_on_catalog"
  | "staff_applications"
  | "season_staff_assignments"
  | "coach_profiles";

const TABLES: Record<AllowedTable, true> = {
  opportunities: true,
  sponsor_partners: true,
  merch_catalog: true,
  add_on_catalog: true,
  staff_applications: true,
  season_staff_assignments: true,
  coach_profiles: true,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();

  const table = body.table as AllowedTable;
  const id = body.id as string;
  const action = body.action as "archive" | "restore" | "deactivate" | "activate";

  if (!table || !TABLES[table]) {
    return NextResponse.json({ error: "Invalid table." }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing record id." }, { status: 400 });
  }

  let payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (action === "archive") {
    payload = { ...payload, is_archived: true };
  } else if (action === "restore") {
    payload = { ...payload, is_archived: false };
  } else if (action === "deactivate") {
    payload = { ...payload, is_active: false };
  } else if (action === "activate") {
    payload = { ...payload, is_active: true };
  } else {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { error } = await supabase
    .schema("epl")
    .from(table)
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
