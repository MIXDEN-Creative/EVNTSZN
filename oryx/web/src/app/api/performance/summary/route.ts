import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/evntszn";
import { getPerformanceSnapshot } from "@/lib/performance-engine";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Scope = "host" | "organizer" | "venue" | "reserve" | "founder";

async function resolveScopeEntityId(scope: Scope, userId: string) {
  if (scope === "host" || scope === "organizer") {
    return userId;
  }

  if (scope === "venue" || scope === "reserve") {
    const { data, error } = await supabaseAdmin
      .from("evntszn_venues")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error(`No ${scope} venue is assigned to this account.`);
    return userId;
  }

  return "00000000-0000-0000-0000-000000000001";
}

export async function GET(request: Request) {
  const viewer = await requirePlatformUser("/account");
  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get("scope") || "host") as Scope;
  const refresh = searchParams.get("refresh") === "1";

  if (!["host", "organizer", "venue", "reserve", "founder"].includes(scope)) {
    return NextResponse.json({ error: "Invalid performance scope." }, { status: 400 });
  }

  if (scope === "founder" && !viewer.isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const entityId = await resolveScopeEntityId(scope, viewer.user!.id);
    const snapshot = await getPerformanceSnapshot(scope === "founder" ? "patience" : scope, entityId, { force: refresh });
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load performance snapshot." },
      { status: 500 },
    );
  }
}
