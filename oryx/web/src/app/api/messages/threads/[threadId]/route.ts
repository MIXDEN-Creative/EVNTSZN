import { NextResponse } from "next/server";
import { appendMessageToThread, getThreadDetail, updateThreadStatus } from "@/lib/messaging";
import { getPlatformViewer } from "@/lib/evntszn";

type Params = Promise<{ threadId: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const viewer = await getPlatformViewer();
    const { threadId } = await params;
    const detail = await getThreadDetail(viewer, threadId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load thread.";
    const status = /forbidden/i.test(message) ? 403 : /auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const viewer = await getPlatformViewer();
    const { threadId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const message = String(body.body || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    await appendMessageToThread(viewer, threadId, message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send message.";
    const status = /forbidden/i.test(message) ? 403 : /auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const viewer = await getPlatformViewer();
    const { threadId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const status = String(body.status || "").trim();

    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    await updateThreadStatus(viewer, threadId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update thread.";
    const status = /forbidden/i.test(message) ? 403 : /auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
