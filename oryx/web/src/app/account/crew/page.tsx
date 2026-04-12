import SurfaceShell from "@/components/shells/SurfaceShell";
import { requirePlatformUser } from "@/lib/evntszn";
import CrewManagerClient from "./CrewManagerClient";

export const dynamic = "force-dynamic";

export default async function AccountCrewPage() {
  await requirePlatformUser("/account/crew");

  return (
    <SurfaceShell
      surface="app"
      eyebrow="Creator tools"
      title="EVNTSZN Crew Marketplace"
      description="Publish your profile, control availability, and work incoming booking requests from one real operational surface."
    >
      <CrewManagerClient />
    </SurfaceShell>
  );
}
