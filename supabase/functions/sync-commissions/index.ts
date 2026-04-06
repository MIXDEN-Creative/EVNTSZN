import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SHEETS_WEBHOOK_URL = Deno.env.get("SHEETS_WEBHOOK_URL")!;

// This is the exact column order your Google Sheet will receive
const HEADERS = [
  "order_id",
  "order_date",
  "order_total",
  "rep_user_id",
  "rep_name",
  "rep_role",
  "rep_base_rate",
  "rep_commission",
  "office_id",
  "assistant_manager_user_id",
  "assistant_manager_name",
  "assistant_manager_rate",
  "assistant_manager_override",
  "promoting_office_owner_user_id",
  "promoting_office_owner_name",
  "promoting_office_owner_rate",
  "promoting_office_owner_override",
  "company_take",
];

function toRow(x: any) {
  return [
    x.order_id ?? "",
    x.order_date ?? "",
    x.order_total ?? "",
    x.rep_user_id ?? "",
    x.rep_name ?? "",
    x.rep_role ?? "",
    x.rep_base_rate ?? "",
    x.rep_commission ?? "",
    x.office_id ?? "",
    x.assistant_manager_user_id ?? "",
    x.assistant_manager_name ?? "",
    x.assistant_manager_rate ?? "",
    x.assistant_manager_override ?? "",
    x.promoting_office_owner_user_id ?? "",
    x.promoting_office_owner_name ?? "",
    x.promoting_office_owner_rate ?? "",
    x.promoting_office_owner_override ?? "",
    x.company_take ?? "",
  ];
}

async function postToSheets(rows: any[]) {
  // We send headers every time so Sheets always stays readable
  const payload = {
    type: "commissions",
    rows: [HEADERS, ...rows],
  };

  const res = await fetch(SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Sheets webhook failed: ${res.status} ${text}`);
  return text;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pull from the VIEW, not orders
    const { data, error } = await supabase
      .from("v_commission_export")
      .select("*")
      .order("order_date", { ascending: true });

    if (error) return new Response(`Supabase query failed: ${error.message}`, { status: 500 });

    const rows = (data ?? []).map(toRow);

    await postToSheets(rows);

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e?.message ?? e), { status: 500 });
  }
});
