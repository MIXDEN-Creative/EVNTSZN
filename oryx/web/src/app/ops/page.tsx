import { redirect } from "next/navigation";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { getRestrictedUrl } from "@/lib/domains";

export default async function OpsEntryPage() {
  await requirePlatformUser("/ops");
  const viewer = await getPlatformViewer();

  if (viewer.isPlatformAdmin || viewer.profile?.primary_role === "organizer") {
    redirect("/organizer");
  }

  if (viewer.profile?.primary_role === "venue") {
    redirect("/venue");
  }

  redirect(
    getRestrictedUrl("ops", {
      fallbackSurface: "app",
      fallbackPath: "/account",
      fallbackLabel: "Return to my account",
    })
  );
}
