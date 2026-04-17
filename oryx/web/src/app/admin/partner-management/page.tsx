import PartnerManagementClient from "@/components/admin/PartnerManagementClient";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminPartnerManagementPage() {
  await requireAdminPermission("admin.manage", "/admin/partner-management");

  return (
    <SurfaceShell
      surface="hq"
      eyebrow="Records"
      title="Partner Management"
      description="Manage partner profiles, logo placements, and visibility across the EVNTSZN network."
    >
      <PartnerManagementClient />
    </SurfaceShell>
  );
}
