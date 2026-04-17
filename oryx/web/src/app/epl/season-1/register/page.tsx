import RegisterForm from "./RegisterForm";
import { getBaseWaiverUrl } from "@/lib/epl/waiver";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export default function EPLSeasonOneRegisterPage() {
  const waiverUrl = getBaseWaiverUrl();
  return (
    <PublicPageFrame
      title="Season 1 Player Registration"
      description="Claim your spot, build your player profile, handle waiver and payment, and get into EPL coed adult flag football with a flow built for draft night and game day."
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
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
        </div>
        <div className="ev-panel md:p-8">
          <RegisterForm />
        </div>
      </section>
    </PublicPageFrame>
  );
}
