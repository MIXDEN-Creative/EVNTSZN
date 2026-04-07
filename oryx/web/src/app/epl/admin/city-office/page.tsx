import { requireAdminPermission } from "@/lib/admin-auth";
import CityOfficeClient from "./CityOfficeClient";

export default async function CityOfficePage() {
  await requireAdminPermission("admin.manage", "/epl/admin/city-office");
  return <CityOfficeClient />;
}
