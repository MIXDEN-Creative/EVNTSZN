import Link from "next/link";

export default function OrganizerApplyPage() {
  return (
    <main className="ev-surface ev-surface--web min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="ev-kicker">Organizer application</div>
        <h1 className="ev-title">Apply for independent organizer access.</h1>
        <p className="ev-subtitle">
          Approved organizers get scoped access to ops, discovery eligibility review, and only the surfaces that match their role.
        </p>

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
          <Link href="/hosts" className="ev-button-secondary">
            Explore the EVNTSZN network
          </Link>
        </div>
      </div>
    </main>
  );
}
