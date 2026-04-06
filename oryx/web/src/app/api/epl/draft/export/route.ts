import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type CsvRow = Record<string, unknown>;

function toCsv(rows: CsvRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const kind = req.nextUrl.searchParams.get("kind") || "board";
  const supabase = getSupabaseAdmin();

  let data: CsvRow[] | null = [];
  let error: { message: string } | null = null;

  if (kind === "board") {
    ({ data, error } = await supabase
      .from("epl_v_admin_full_draft_board")
      .select("*")
      .eq("season_slug", seasonSlug)
      .order("overall_pick_number"));
  } else if (kind === "pool") {
    ({ data, error } = await supabase
      .from("epl_v_admin_player_pool")
      .select("*")
      .eq("season_slug", seasonSlug)
      .order("player_name"));
  } else if (kind === "log") {
    ({ data, error } = await supabase
      .from("epl_v_admin_draft_action_log")
      .select("*")
      .eq("season_slug", seasonSlug)
      .order("created_at", { ascending: false }));
  } else {
    return NextResponse.json({ error: "Unsupported export kind." }, { status: 400 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csv = toCsv(data || []);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${seasonSlug}-${kind}.csv"`,
    },
  });
}
