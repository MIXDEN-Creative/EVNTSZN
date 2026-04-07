import { requireAdminPermission } from "@/lib/admin-auth";
import OpportunitiesAdminClient from "./OpportunitiesAdminClient";

export default async function AdminOpportunitiesPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/opportunities");
  return <OpportunitiesAdminClient />;
}
