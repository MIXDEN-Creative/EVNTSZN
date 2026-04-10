import { requireAdminPermission } from "@/lib/admin-auth";
import WorkforceAdminClient from "./WorkforceAdminClient";

export default async function WorkforceAdminPage() {
  await requireAdminPermission("workforce.view", "/epl/admin/workforce");
  return <WorkforceAdminClient />;
}
