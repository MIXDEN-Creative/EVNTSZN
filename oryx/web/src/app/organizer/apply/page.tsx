import Link from "next/link";

export default function OrganizerApplyPage() {
  return (
    <main className="ev-surface ev-surface--web min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="ev-kicker">Organizer application</div>
        <h1 className="ev-title">Apply for independent organizer access.</h1>
        <p className="ev-subtitle">
          Independent Organizers use EVNTSZN as an external operating platform. Approved organizers get scoped access to ops, discovery eligibility review, and only the surfaces that match their role, without being treated as EVNTSZN Hosts by default.
        </p>

        <div className="ev-panel mt-8 p-6">
          <div className="ev-section-kicker">Choose the right path</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-lg font-semibold text-white">Independent Organizer</div>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Best for external operators who want event management, scoped visibility review, and a clean path into sponsor interest or paid growth without assuming internal network perks.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-lg font-semibold text-white">EVNTSZN Host Network</div>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Best for operators who want to apply into the EVNTSZN internal network path for host progression, city support, and deeper network-aligned operating access.
              </p>
            </div>
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
            <span>I understand organizer access is reviewed, scoped, and may be limited by city or discovery eligibility.</span>
          </label>
          <button type="submit" className="ev-button-primary">Submit organizer application</button>
        </form>

        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <Link href="/hosts" className="ev-button-secondary">
              Explore the EVNTSZN Host Network
            </Link>
            <Link href="/partners/packages" className="ev-button-secondary">
              Explore sponsor options
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
