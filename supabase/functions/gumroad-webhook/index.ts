export const config = {
  verifyJWT: false,
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function toCents(value: unknown): number {
  if (typeof value === "number") {
    return value > 1000 ? Math.round(value) : Math.round(value * 100);
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return n > 1000 ? Math.round(n) : Math.round(n * 100);
  }
  return 0;
}

function pickExternalId(payload: any) {
  return (
    payload?.sale_id ||
    payload?.sale?.id ||
    payload?.id ||
    payload?.purchase_id ||
    payload?.order_id ||
    null
  );
}

function pickEmail(payload: any) {
  return (
    payload?.email ||
    payload?.buyer_email ||
    payload?.purchase_email ||
    payload?.sale?.email ||
    payload?.sale?.purchase_email ||
    null
  );
}

function pickAmountCents(payload: any) {
  return (
    toCents(payload?.price_cents) ||
    toCents(payload?.price) ||
    toCents(payload?.amount_cents) ||
    toCents(payload?.amount) ||
    toCents(payload?.sale?.price_cents) ||
    toCents(payload?.sale?.price) ||
    0
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("GUMROAD_WEBHOOK_SECRET");
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ORG_ID = Deno.env.get("MIXDEN_ORG_ID")!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const rawBody = await req.text();
  const contentType = req.headers.get("content-type") || "";

  let payload: any = null;

  if (contentType.includes("application/json")) {
    payload = safeJsonParse(rawBody) ?? {};
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    payload = Object.fromEntries(params.entries());
    for (const k of Object.keys(payload)) {
      const maybe = safeJsonParse(payload[k]);
      if (maybe && typeof maybe === "object") payload[k] = maybe;
    }
  } else {
    payload = safeJsonParse(rawBody) ?? { raw: rawBody };
  }

  const headersObj: Record<string, string> = {};
  for (const [k, v] of req.headers.entries()) headersObj[k] = v;

  const { data: eventRow, error: logErr } = await supabase
    .from("webhook_events")
    .insert({
      source: "gumroad",
      headers: headersObj,
      payload,
      processed: false,
      error: null,
    })
    .select("id")
    .single();

  if (logErr) {
    return new Response(`Failed to log webhook: ${logErr.message}`, { status: 500 });
  }

  const externalId = pickExternalId(payload);
  const buyerEmail = pickEmail(payload);
  const amountCents = pickAmountCents(payload);

  const { error: orderErr } = await supabase.from("orders").insert({
    org_id: ORG_ID,
    product_id: null,
    buyer_email: buyerEmail,
    amount_cents: amountCents,
    source: "gumroad",
    external_id: externalId,
    raw: payload,
  });
// ---- Push to Google Sheets (Orders tab) ----
try {
  const sheetsSyncUrl = Deno.env.get("SHEETS_SYNC_URL");
  if (!sheetsSyncUrl) throw new Error("Missing env: SHEETS_SYNC_URL");

  // Only push if the DB insert succeeded
  if (!orderErr) {
    const row = [
      new Date().toISOString(),     // created_at
      "gumroad",                    // source
      externalId ?? null,           // external_id
      buyerEmail ?? null,           // buyer_email
      amountCents ?? null,          // amount_cents
      ORG_ID ?? null,               // org_id
      null,                         // product_id
      JSON.stringify(payload ?? {}) // raw
    ];

    await fetch(sheetsSyncUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "orders", rows: [row] }),
    });
  }
} catch (_e) {
  // Don't break the webhook if Sheets fails
}

  const duplicate =
    orderErr?.message?.toLowerCase().includes("duplicate") || (orderErr as any)?.code === "23505";

  const processedOk = !orderErr || duplicate;

  await supabase
    .from("webhook_events")
    .update({
      processed: processedOk,
      error: processedOk ? null : orderErr?.message ?? "Unknown error",
    })
    .eq("id", eventRow.id);

  if (!processedOk) {
    return new Response(`Order insert failed: ${orderErr?.message}`, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
