import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { getRestrictedUrl } from "@/lib/domains";
import OperatorOpsDashboard from "./OperatorOpsDashboard";

export default async function OpsEntryPage() {
  await requirePlatformUser("/ops");
  const viewer = await getPlatformViewer();
  const runtimeHost = (await headers()).get("host") || undefined;

  if (viewer.isPlatformAdmin || viewer.profile?.primary_role === "organizer") {
    redirect("/organizer");
  }

  if (viewer.profile?.primary_role === "venue") {
    redirect("/venue");
  }

  if (viewer.operatorProfile?.is_active && viewer.operatorProfile.surface_access.includes("ops")) {
    return (
      <OperatorOpsDashboard
        profile={viewer.profile}
        operatorProfile={viewer.operatorProfile}
        runtimeHost={runtimeHost}
      />
    );
  }

  redirect(
    getRestrictedUrl("ops", {
      fallbackSurface: "app",
      fallbackPath: "/account",
      fallbackLabel: "Return to my account",
    })
  );
}
