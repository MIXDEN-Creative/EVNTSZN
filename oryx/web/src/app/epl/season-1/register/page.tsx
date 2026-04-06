import RegisterForm from "./RegisterForm";
import SurfaceShell from "@/components/shells/SurfaceShell";

export default function EPLSeasonOneRegisterPage() {
  return (
    <SurfaceShell
      surface="epl"
      eyebrow="EVNTSZN Prime League"
      title="Season 1 Player Registration"
      description="Submit your registration, lock in your player profile, and move into the Season 1 pipeline. Clean process. Serious league."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Season entry</div>
            <div className="ev-meta-value">$95 registration fee with player profile, application, and payment linkage.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">League surface</div>
            <div className="ev-meta-value">Public EPL pages stay premium and open while league admin and draft operations remain gated.</div>
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
