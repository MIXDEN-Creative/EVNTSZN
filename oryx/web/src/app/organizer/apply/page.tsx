import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export default function OrganizerApplyPage() {
  return (
    <PublicPageFrame>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="ev-kicker">Partner application</div>
        <h1 className="ev-title">Apply for partner access.</h1>
        <p className="ev-subtitle">
          Partners use EVNTSZN as a self-operated event platform. Approved partners get scoped access to operations, discovery review, and professional tools for managing their own brand, audience, and operating model.
        </p>

        <div className="ev-panel mt-8 p-8">
          <div className="ev-section-kicker">Partner path</div>
          <h3 className="mt-4 text-2xl font-black">Your brand. Our system.</h3>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Use EVNTSZN to power your event lifecycle without being treated as internal network staff. This lane is built for operators who want control over their own events, venue relationships, and attendee data while leveraging EVNTSZN discovery and ticketing.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Keep your own event economics outside the Curator split.",
              "Manage your own ticket types and holds.",
              "Access Crew Marketplace and EVNTSZN Link.",
              "Professional analytics and pulse tracking.",
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                <span className="text-[#A259FF]">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <form action="/api/public/applications" method="post" className="ev-panel mt-8 grid gap-4 p-6">
          <input type="hidden" name="application_type" value="organizer" />
          <input type="hidden" name="requested_role_key" value="independent_organizer" />
          <input name="full_name" className="ev-field" placeholder="Full name" required />
          <input name="email" type="email" className="ev-field" placeholder="Email" required />
          <input name="company_name" className="ev-field" placeholder="Brand or operating company" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="city" className="ev-field" placeholder="Primary city" />
            <input name="state" className="ev-field" placeholder="State" />
          </div>
          <textarea name="motivation" className="ev-textarea" placeholder="What kind of experiences do you want to build on EVNTSZN?" rows={5} />
          <textarea name="experience_summary" className="ev-textarea" placeholder="Tell us about your operating history, audience, or venue relationships." rows={5} />
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
            <input type="checkbox" name="terms_accepted" value="true" className="mt-1" required />
            <span>I understand partner access is reviewed, scoped, and may be limited by city or discovery eligibility.</span>
          </label>
          <button type="submit" className="ev-button-primary">Submit partner application</button>
        </form>

        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <Link href="/hosts" className="ev-button-secondary">
              Explore the EVNTSZN Curator Network
            </Link>
            <Link href="/sponsors" className="ev-button-secondary">
              Explore sponsor options
            </Link>
          </div>
        </div>
      </div>
    </PublicPageFrame>
  );
}
