import { redirect } from "next/navigation";
import SurfaceShell from "@/components/shells/SurfaceShell";
import PulseFeedClient from "@/components/pulse/PulseFeedClient";
import PulseModerationConsole from "@/components/pulse/PulseModerationConsole";
import { getRestrictedUrl } from "@/lib/domains";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { canAccessInternalPulse, getInternalPulseFeed, getPulseModeratorContext } from "@/lib/pulse";

export const dynamic = "force-dynamic";

export default async function OpsPulsePage() {
  await requirePlatformUser("/ops/pulse");
  const viewer = await getPlatformViewer();

  if (!canAccessInternalPulse(viewer)) {
    redirect(
      getRestrictedUrl("ops", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      }),
    );
  }

  const [items, moderationContext] = await Promise.all([getInternalPulseFeed(), getPulseModeratorContext(viewer)]);

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Internal Pulse"
      title="See the signals that move operations."
      description="Internal Pulse includes reserve pressure, crew movement, desk-linked actions, and operational alerts. Public-safe discovery signals stay on the public feed."
    >
      <PulseFeedClient scope="internal" initialItems={items} canPost />
      {moderationContext.canModerate ? <PulseModerationConsole /> : null}
    </SurfaceShell>
  );
}
