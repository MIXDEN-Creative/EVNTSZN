import RegisterForm from "./RegisterForm";
import { getBaseWaiverUrl } from "@/lib/epl/waiver";
import SurfaceShell from "@/components/shells/SurfaceShell";

export default function EPLSeasonOneRegisterPage() {
  const waiverUrl = getBaseWaiverUrl();
  return (
    <SurfaceShell
      surface="epl"
      eyebrow="EVNTSZN Prime League"
      title="Season 1 Player Registration"
      description="Claim your spot, build your player profile, handle waiver and payment, and get into EPL coed adult flag football with a flow built for draft night and game day."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Season entry</div>
            <div className="ev-meta-value">$95 registration fee with player profile, payment, and league intake handled in one guided flow.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Draft-night path</div>
            <div className="ev-meta-value">Your application feeds the player pool, team-needs review, and the live draftboard used to build each 12-player club.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Waiver</div>
            <div className="ev-meta-value">League waiver link: {waiverUrl.replace(/^https?:\/\//, "")}. Finish it after checkout so your file stays ready for review and assignment.</div>
          </div>
        </>
      }
    >
        <div className="ev-panel md:p-8">
          <RegisterForm />
        </div>
    </SurfaceShell>
  );
}
