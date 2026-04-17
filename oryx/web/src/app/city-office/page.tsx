import { redirect } from "next/navigation";
import CityOfficeClient from "@/app/epl/admin/city-office/CityOfficeClient";
import { getRestrictedUrl } from "@/lib/domains";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";

export default async function CityOfficeSurfacePage() {
  await requirePlatformUser("/city-office");
  const viewer = await getPlatformViewer();

  const hasCityAccess =
    viewer.isPlatformAdmin ||
    (
      viewer.operatorProfile?.is_active === true &&
      viewer.operatorProfile.dashboard_access.includes("city") &&
      (
        viewer.operatorProfile.city_scope.length > 0 ||
        Boolean(viewer.profile?.city)
      )
    );

  if (!hasCityAccess) {
    redirect(
      getRestrictedUrl("app", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      }),
    );
  }

  return (
    <CityOfficeClient
      apiPath="/api/city-office"
      title="Run your city office without crossing into markets you do not own."
      description="City commissioners, deputies, and city leaders can work from a scoped operating view that keeps revenue, approvals, EVNTSZN Curators, Partners, and upcoming event volume tied to the cities they are actually assigned."
      scopeNote="You are only seeing the cities attached to your operator profile. Founder and HQ override still sit above this surface."
    />
  );
}
