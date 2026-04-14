import { requireAdminPermission } from "@/lib/admin-auth";
import { getFounderSession } from "@/lib/founder-session";
import ControlCenterClient from "./ControlCenterClient";

export default async function ControlCenterPage() {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/control-center");
  const founder = await getFounderSession();
  const isFounder = Boolean(founder) || (user?.id?.startsWith("founder:") ?? false);

  return <ControlCenterClient isFounder={isFounder} />;
}
