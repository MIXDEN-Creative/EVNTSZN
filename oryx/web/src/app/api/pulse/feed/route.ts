import { NextRequest, NextResponse } from "next/server";
import { getPlatformViewer } from "@/lib/evntszn";
import { canAccessInternalPulse, getInternalPulseFeed, getPublicPulseFeed } from "@/lib/pulse";

export async function GET(request: NextRequest) {
  try {
    const scope = request.nextUrl.searchParams.get("scope") === "internal" ? "internal" : "public";
    if (scope === "public") {
      const items = await getPublicPulseFeed();
      return NextResponse.json({ items });
    }

    const viewer = await getPlatformViewer();
    if (!canAccessInternalPulse(viewer)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const items = await getInternalPulseFeed();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Pulse." }, { status: 500 });
  }
}
