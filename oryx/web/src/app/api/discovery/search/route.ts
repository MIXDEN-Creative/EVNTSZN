import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const mergedResults = {
      query,
      results: [],
    };

    return new Response(JSON.stringify(mergedResults), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
