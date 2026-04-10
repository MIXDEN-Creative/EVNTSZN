import RegisterForm from "./RegisterForm";
import SurfaceShell from "@/components/shells/SurfaceShell";

export default function EPLSeasonOneRegisterPage() {
  return (
    <SurfaceShell
      surface="epl"
      eyebrow="EVNTSZN Prime League"
      title="Season 1 Player Registration"
      description="Claim your spot, build your player profile, and get into Baltimore flag football with a registration flow that feels ready for the season."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Season entry</div>
            <div className="ev-meta-value">$95 registration fee with player profile, payment, and league intake handled in one step.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">What happens next</div>
            <div className="ev-meta-value">After registration, the league can place you into draft-night and Season 1 updates without dropping you into a dead-end sign-up loop.</div>
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
