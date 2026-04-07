import { requireAdminPermission } from "@/lib/admin-auth";
import SponsorsAdminClient from "./SponsorsAdminClient";

export default async function SponsorsAdminPage() {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  return <SponsorsAdminClient />;
}
