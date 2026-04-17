import InternalDeskQueueClient from "@/components/admin/InternalDeskQueueClient";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminHostDeskPage() {
  await requireAdminPermission("admin.manage", "/admin/host-desk");

  return (
    <InternalDeskQueueClient
      deskSlug="host"
      deskLabel="Curator desk"
      title="Review curator intake and network-side approvals."
      description="Curator applications and host-lane routing work items surface here so city leadership and founder can move reviews without losing the queue."
    />
  );
}
