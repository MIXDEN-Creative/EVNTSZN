import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { accessToken?: string; refreshToken?: string }
      | null;

    if (!body?.accessToken || !body.refreshToken) {
      return NextResponse.json({ error: "Missing session tokens." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sync session." },
      { status: 500 },
    );
  }
}
