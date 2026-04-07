import { requireAdminPermission } from "@/lib/admin-auth";
import HiringAdminClient from "./HiringAdminClient";

export default async function HiringAdminPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  return <HiringAdminClient />;
}
