import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEngagementSnapshot } from "@/lib/engagement";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    const snapshot = await getEngagementSnapshot(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load engagement snapshot." },
      { status: 500 },
    );
  }
}
