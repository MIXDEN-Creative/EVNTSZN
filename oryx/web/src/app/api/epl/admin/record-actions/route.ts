import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type AllowedTable =
  | "opportunities"
  | "sponsor_partners"
  | "merch_catalog"
  | "add_on_catalog"
  | "staff_applications"
  | "season_staff_assignments"
  | "coach_profiles"
  | "evntszn_profiles"
  | "evntszn_events"
  | "evntszn_nodes";

const TABLES: Record<AllowedTable, { schema: "epl" | "public" }> = {
  opportunities: { schema: "epl" },
  sponsor_partners: { schema: "epl" },
  merch_catalog: { schema: "epl" },
  add_on_catalog: { schema: "epl" },
  staff_applications: { schema: "epl" },
  season_staff_assignments: { schema: "epl" },
  coach_profiles: { schema: "epl" },
  evntszn_profiles: { schema: "public" },
  evntszn_events: { schema: "public" },
  evntszn_nodes: { schema: "public" },
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const tableName = body.table as AllowedTable;
  const id = body.id as string;
  const action = body.action as string;

  const tableConfig = tableName ? TABLES[tableName] : null;

  if (!tableConfig) {
    return NextResponse.json({ error: "Invalid table." }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing record id." }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await supabase
      .schema(tableConfig.schema)
      .from(tableName)
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  let payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (action === "archive") {
    payload = { ...payload, is_archived: true, status: "archived" };
  } else if (action === "restore") {
    payload = { ...payload, is_archived: false, status: "active" };
  } else if (action === "deactivate") {
    payload = { ...payload, is_active: false };
  } else if (action === "activate") {
    payload = { ...payload, is_active: true };
  } else if (action === "publish") {
    payload = { ...payload, status: "published", visibility: "published" };
  } else if (action === "unpublish") {
    payload = { ...payload, status: "draft", visibility: "draft" };
  } else if (action === "suspend") {
    payload = { ...payload, is_active: false, primary_role: "suspended" };
  } else {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { error } = await supabase
    .schema(tableConfig.schema)
    .from(tableName)
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
