import InternalDeskQueueClient from "@/components/admin/InternalDeskQueueClient";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminPartnersDeskPage() {
  await requireAdminPermission("admin.manage", "/admin/partners-desk");

  return (
    <InternalDeskQueueClient
      deskSlug="partner"
      deskLabel="Sponsor desk"
      title="Work sponsor interest, sponsorship follow-up, and deliverable routing."
      description="Sponsor package inquiries and sponsor-side commercial work items route here so Growth and Sponsorships has a real operational queue instead of a dead landing page."
    />
  );
}
