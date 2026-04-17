import SurfaceShell from "@/components/shells/SurfaceShell";
import PerformanceScorePanel from "@/components/performance/PerformanceScorePanel";
import { requirePlatformUser } from "@/lib/evntszn";
import LinkManagerClient from "./LinkManagerClient";

export const dynamic = "force-dynamic";

export default async function AccountLinkPage() {
  await requirePlatformUser("/account/link");

  return (
    <SurfaceShell
      surface="app"
      eyebrow="Creator tools"
      title="EVNTSZN Link"
      description="Run your public curator conversion page from one desk without leaving the member side of the platform."
    >
      <PerformanceScorePanel scope="host" title="CPS" />
      <LinkManagerClient />
    </SurfaceShell>
  );
}
