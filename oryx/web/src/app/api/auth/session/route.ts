import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformViewer } from "@/lib/evntszn";

function resolveDashboard(viewer: Awaited<ReturnType<typeof getPlatformViewer>>) {
  const operator = viewer.operatorProfile;

  if (!viewer.user) {
    return { dashboardHref: null, dashboardLabel: null };
  }

  if (viewer.isPlatformAdmin) {
    return { dashboardHref: "/epl/admin", dashboardLabel: "HQ Admin" };
  }

  if (viewer.profile?.primary_role === "organizer" || operator?.organizer_classification === "independent_organizer") {
    return { dashboardHref: "/organizer", dashboardLabel: "Partner Workspace" };
  }

  if (viewer.profile?.primary_role === "venue") {
    return { dashboardHref: "/venue", dashboardLabel: "Venue Ops" };
  }

  if (operator?.dashboard_access?.includes("city")) {
    return { dashboardHref: "/city-office", dashboardLabel: "City Office" };
  }

  if (operator?.surface_access?.includes("ops")) {
    return { dashboardHref: "/ops", dashboardLabel: "Ops Workspace" };
  }

  return { dashboardHref: "/account", dashboardLabel: "Member Account" };
}

export async function GET() {
  try {
    const viewer = await getPlatformViewer();
    const signedIn = Boolean(viewer.user);
    const isFounder = viewer.user?.id?.startsWith("founder:") === true;
    const isPlatformAdmin = viewer.isPlatformAdmin || isFounder;
    const { dashboardHref, dashboardLabel } = resolveDashboard(viewer);

    return NextResponse.json({
      signedIn,
      isFounder,
      isPlatformAdmin,
      dashboardHref,
      dashboardLabel,
      signOutHref: "/account/logout",
    });
  } catch {
    return NextResponse.json(
      {
        signedIn: false,
        isFounder: false,
        isPlatformAdmin: false,
        dashboardHref: null,
        dashboardLabel: null,
        signOutHref: "/account/logout",
      },
      { status: 200 },
    );
  }
}

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
