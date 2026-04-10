import { redirect } from "next/navigation";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import StaffTimeClient from "./StaffTimeClient";

export default async function OpsTimePage() {
  await requirePlatformUser("/ops/time");
  const viewer = await getPlatformViewer();

  if (!viewer.isPlatformAdmin && !viewer.operatorProfile?.is_active) {
    redirect("/ops");
  }

  return <StaffTimeClient />;
}
