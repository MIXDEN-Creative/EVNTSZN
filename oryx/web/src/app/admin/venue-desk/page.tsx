import InternalDeskQueueClient from "@/components/admin/InternalDeskQueueClient";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminVenueDeskPage() {
  await requireAdminPermission("admin.manage", "/admin/venue-desk");

  return (
    <InternalDeskQueueClient
      deskSlug="agreements"
      deskLabel="Venue desk"
      title="Work venue approvals, agreement routing, and launch blockers."
      description="Venue agreement and onboarding requests route here so founder and sponsorship leadership can review readiness, clear paperwork, and move Reserve or venue launch follow-up."
    />
  );
}
