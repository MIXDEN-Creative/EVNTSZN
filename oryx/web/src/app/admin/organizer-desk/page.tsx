import InternalDeskQueueClient from "@/components/admin/InternalDeskQueueClient";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminOrganizerDeskPage() {
  await requireAdminPermission("admin.manage", "/admin/organizer-desk");

  return (
    <InternalDeskQueueClient
      deskSlug="organizer"
      deskLabel="Partner desk"
      title="Review partner intake and operator follow-through from one queue."
      description="Partner applications and partner-side operating work items land here so founder and operations can move approvals, follow-up, and assignment without placeholder screens."
    />
  );
}
