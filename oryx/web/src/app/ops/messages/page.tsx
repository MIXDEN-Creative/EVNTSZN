import { redirect } from "next/navigation";
import SurfaceShell from "@/components/shells/SurfaceShell";
import MessagingClient from "@/components/messages/MessagingClient";
import { getRestrictedUrl } from "@/lib/domains";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { canAccessInternalMessaging, listMessageThreads } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export default async function OpsMessagesPage() {
  await requirePlatformUser("/ops/messages");
  const viewer = await getPlatformViewer();

  if (!canAccessInternalMessaging(viewer)) {
    redirect(
      getRestrictedUrl("ops", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      }),
    );
  }

  const threads = await listMessageThreads(viewer, "internal");

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Internal messaging"
      title="Coordinate work without exposing ops to public threads."
      description="Internal messaging is for approvals, routing, reserve pressure, crew coverage, and desk-linked coordination only."
    >
      <MessagingClient scope="internal" initialThreads={threads} canManage />
    </SurfaceShell>
  );
}
