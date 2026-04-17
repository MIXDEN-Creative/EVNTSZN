import { NextRequest, NextResponse } from "next/server";
import { createMessageThread, listMessageThreads } from "@/lib/messaging";
import { getPlatformViewer } from "@/lib/evntszn";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getPlatformViewer();
    if (!viewer.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const scope = request.nextUrl.searchParams.get("scope") === "internal" ? "internal" : "public";
    const threads = await listMessageThreads(viewer, scope);
    return NextResponse.json({ threads });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load threads." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await getPlatformViewer();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const scope = String(body.scope || "public").trim() === "internal" ? "internal" : "public";
    const subject = String(body.subject || "").trim();
    const message = String(body.body || "").trim();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const threadId = await createMessageThread(viewer, {
      scope,
      subject,
      body: message,
      deskSlug: String(body.deskSlug || "").trim() || null,
    });

    return NextResponse.json({ ok: true, threadId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create thread." }, { status: 500 });
  }
}
