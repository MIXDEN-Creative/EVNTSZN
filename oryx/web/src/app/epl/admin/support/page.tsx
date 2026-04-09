import { requireAdminPermission } from "@/lib/admin-auth";
import SupportDeskClient from "./SupportDeskClient";

export default async function SupportDeskPage() {
  await requireAdminPermission("support.respond", "/epl/admin/support");
  return <SupportDeskClient />;
}
