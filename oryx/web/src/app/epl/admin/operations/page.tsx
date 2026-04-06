import { requireHq } from "@/lib/admin-auth";
import LeagueOfficeAdminShell from "./components/LeagueOfficeAdminShell";

export default async function EPLOperationsPage() {
  await requireHq("/epl/admin/operations");
  return <LeagueOfficeAdminShell />;
}
