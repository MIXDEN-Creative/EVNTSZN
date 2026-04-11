import RegisterForm from "./RegisterForm";
import SurfaceShell from "@/components/shells/SurfaceShell";

export default function EPLSeasonOneRegisterPage() {
  return (
    <SurfaceShell
      surface="epl"
      eyebrow="EVNTSZN Prime League"
      title="Season 1 Player Registration"
      description="Claim your spot, build your player profile, and get into Baltimore coed flag football with a registration flow built for the season."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Season entry</div>
            <div className="ev-meta-value">$95 registration fee with player profile, payment, and league intake handled in one step.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">What happens next</div>
            <div className="ev-meta-value">After registration, you stay in the Season 1 flow for draft night, player updates, and league communication.</div>
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
