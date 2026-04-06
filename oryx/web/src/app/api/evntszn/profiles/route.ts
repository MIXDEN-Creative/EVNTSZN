import { NextResponse } from "next/server";
import { ensurePlatformProfile, requirePlatformUser, type PlatformRole } from "@/lib/evntszn";

type ProfileBody = {
  fullName?: string;
  primaryRole?: PlatformRole;
  city?: string;
  state?: string;
};

export async function POST(request: Request) {
  const viewer = await requirePlatformUser("/account");
  const body = (await request.json().catch(() => ({}))) as ProfileBody;

  try {
    const profile = await ensurePlatformProfile(viewer.user!.id, {
      fullName:
        body.fullName ||
        viewer.user?.user_metadata?.full_name ||
        viewer.user?.email ||
        null,
      primaryRole: body.primaryRole || "attendee",
      city: body.city || null,
      state: body.state || null,
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profile update failed." },
      { status: 500 }
    );
  }
}
