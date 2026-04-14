import SurfaceShell from "@/components/shells/SurfaceShell";
import { requirePlatformUser } from "@/lib/evntszn";
import NodeManagerClient from "./NodeManagerClient";

export const dynamic = "force-dynamic";

export default async function AccountNodesPage() {
  await requirePlatformUser("/account/nodes");

  return (
    <SurfaceShell
      surface="app"
      eyebrow="Infrastructure"
      title="EVNTSZN Nodes"
      description="Run the physical and digital discovery points that route people into live events, crew funnels, venue activity, and Link pages."
    >
      <NodeManagerClient />
    </SurfaceShell>
  );
}
