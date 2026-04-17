import Link from "next/link";
import SurfaceShell from "@/components/shells/SurfaceShell";
import PerformanceScorePanel from "@/components/performance/PerformanceScorePanel";
import { getAdminOrigin, getScannerOrigin } from "@/lib/domains";
import type { OperatorProfile, PlatformProfile } from "@/lib/evntszn";
import { getOrganizerClassificationLabel } from "@/lib/operator-access";

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export default function OperatorOpsDashboard({
  profile,
  operatorProfile,
  runtimeHost,
}: {
  profile: PlatformProfile | null;
  operatorProfile: OperatorProfile;
  runtimeHost?: string;
}) {
  const organizerClassification = operatorProfile.organizer_classification || "evntszn_host";
  const actions = [
    operatorProfile.module_access.includes("events") ? (
      <Link key="events" href="/organizer" className="ev-button-primary">
        Open event operations
      </Link>
    ) : null,
    operatorProfile.can_access_scanner ? (
      <a key="scanner" href={getScannerOrigin(runtimeHost)} className="ev-button-secondary">
        Open scanner surface
      </a>
    ) : null,
    operatorProfile.approval_authority.length ? (
      <a key="approvals" href={`${getAdminOrigin(runtimeHost)}/approvals`} className="ev-button-secondary">
        Review approvals
      </a>
    ) : null,
    operatorProfile.dashboard_access.includes("city") ? (
      <a key="city-office" href="/city-office" className="ev-button-secondary">
        Open city office
      </a>
    ) : null,
    operatorProfile.module_access.includes("staffing") ? (
      <Link key="time" href="/ops/time" className="ev-button-secondary">
        Track time
      </Link>
    ) : null,
    organizerClassification === "evntszn_host" || organizerClassification === "city_host" ? (
      <Link key="host-network" href="/hosts" className="ev-button-secondary">
        Host network path
      </Link>
    ) : null,
    organizerClassification === "independent_organizer" ? (
      <Link key="sponsor-interest" href="/partners/packages" className="ev-button-secondary">
        Sponsor options
      </Link>
    ) : null,
  ].filter(Boolean);

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Operator workspace"
      title="Your EVNTSZN operating layer"
      description="Approved hosts, city operators, and independent organizers land here first so they can see their scope, current access, and the next actions they are cleared to take."
      actions={<>{actions}</>}
      meta={
        <>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Role</div>
              <div className="ev-meta-value">{labelize(operatorProfile.role_key)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Classification</div>
              <div className="ev-meta-value">{getOrganizerClassificationLabel(organizerClassification)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">City scope</div>
              <div className="ev-meta-value">{operatorProfile.city_scope.length ? operatorProfile.city_scope.join(", ") : profile?.city || "Unassigned"}</div>
          </div>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="lg:col-span-2">
          <PerformanceScorePanel
            scope={organizerClassification === "independent_organizer" ? "organizer" : "host"}
            title={organizerClassification === "independent_organizer" ? "O-Score" : "HPS"}
          />
        </div>
        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Access summary</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Dashboards</div>
              <div className="mt-3 text-sm leading-7 text-white/72">
                {operatorProfile.dashboard_access.length ? operatorProfile.dashboard_access.map(labelize).join(", ") : "No dashboards assigned yet."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Surface access</div>
              <div className="mt-3 text-sm leading-7 text-white/72">
                {operatorProfile.surface_access.length ? operatorProfile.surface_access.map(labelize).join(", ") : "No protected surfaces assigned yet."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Modules</div>
              <div className="mt-3 text-sm leading-7 text-white/72">
                {operatorProfile.module_access.length ? operatorProfile.module_access.map(labelize).join(", ") : "No modules assigned yet."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Approval authority</div>
              <div className="mt-3 text-sm leading-7 text-white/72">
                {operatorProfile.approval_authority.length ? operatorProfile.approval_authority.map(labelize).join(", ") : "No approval authority assigned."}
              </div>
            </div>
          </div>
        </section>

        <section className="ev-panel p-6">
          <div className="ev-section-kicker">Operating status</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Discovery eligibility</div>
              <div className="mt-2 text-sm text-white/65">
                Inventory visibility and public ranking stay inside the approval and discovery control surfaces. Your current role can {operatorProfile.can_manage_discovery ? "" : "not "}manage discovery settings.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Network path</div>
              <div className="mt-2 text-sm text-white/65">
                {organizerClassification === "independent_organizer"
                  ? "You are on the Independent Organizer track. That means event operations stay available, but EVNTSZN Host network tools, internal growth paths, and program perks are not assumed by default."
                  : "You are on an EVNTSZN network-aligned track. Host progression, city support, and controlled program visibility can expand as your role and approvals deepen."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Scanner status</div>
              <div className="mt-2 text-sm text-white/65">
                {operatorProfile.can_access_scanner
                  ? "Scanner access is enabled on your operator profile. Event-level scan assignments still control what you can actually check in."
                  : "Scanner access is not enabled for this role right now."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Workforce tools</div>
              <div className="mt-2 text-sm text-white/65">
                {operatorProfile.module_access.includes("staffing")
                  ? "Time tracking and staffing workflows are available for your assigned shifts and event-day roles."
                  : "Workforce tools are not enabled for this role right now."}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Role progression</div>
              <div className="mt-2 text-sm text-white/65">
                Job title: {operatorProfile.job_title || "Not assigned yet"}.
                Functions: {operatorProfile.functions.length ? operatorProfile.functions.map(labelize).join(", ") : "No functional assignments yet"}.
              </div>
            </div>
          </div>
        </section>
      </div>
    </SurfaceShell>
  );
}
