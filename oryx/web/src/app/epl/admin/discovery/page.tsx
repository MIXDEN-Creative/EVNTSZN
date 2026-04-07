import { requireAdminPermission } from "@/lib/admin-auth";
import DiscoveryAdminClient from "./DiscoveryAdminClient";

export default async function DiscoveryAdminPage() {
  await requireAdminPermission("catalog.manage", "/epl/admin/discovery");

  return <DiscoveryAdminClient />;
}
