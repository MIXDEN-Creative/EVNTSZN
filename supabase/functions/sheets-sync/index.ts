export const config = { verifyJWT: false };

async function postToSheets(type: "orders" | "events" | "sales", rows: any[][]) {
  const SHEETS_URL = Deno.env.get("SHEETS_WEBHOOK_URL");
  const SHEETS_SECRET = Deno.env.get("SHEETS_WEBHOOK_SECRET");

  if (!SHEETS_URL) throw new Error("Missing env: SHEETS_WEBHOOK_URL");
  if (!SHEETS_SECRET) throw new Error("Missing env: SHEETS_WEBHOOK_SECRET");

  const url = `${SHEETS_URL}?secret=${encodeURIComponent(SHEETS_SECRET)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type, rows }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Sheets webhook failed: status=${res.status} body=${text}`);
  }

  return text;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const body = await req.json().catch(() => null);
    if (!body?.type || !Array.isArray(body?.rows)) {
      return new Response("Bad Request: expected {type, rows[]}", { status: 400 });
    }

    await postToSheets(body.type, body.rows);
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String(e?.message ?? e), { status: 500 });
  }
});
