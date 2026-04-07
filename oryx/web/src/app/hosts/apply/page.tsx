import Link from "next/link";

export default function HostApplyPage() {
  return (
    <main className="ev-surface ev-surface--web min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="ev-kicker">Host Network application</div>
        <h1 className="ev-title">Apply to join the EVNTSZN Host Network.</h1>
        <p className="ev-subtitle">
          This is the live intake for host operators. Every application is reviewed by admin, HQ, or city leadership before protected access is granted.
        </p>

        <form action="/api/public/applications" method="post" className="ev-panel mt-8 grid gap-4 p-6">
          <input type="hidden" name="application_type" value="host" />
          <input type="hidden" name="requested_role_key" value="host" />
          <input name="full_name" className="ev-field" placeholder="Full name" required />
          <input name="email" type="email" className="ev-field" placeholder="Email" required />
          <input name="phone" className="ev-field" placeholder="Phone" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="city" className="ev-field" placeholder="City" />
            <input name="state" className="ev-field" placeholder="State" />
          </div>
          <textarea name="motivation" className="ev-textarea" placeholder="Why do you want to operate inside EVNTSZN?" rows={5} />
          <textarea name="experience_summary" className="ev-textarea" placeholder="What live-event, nightlife, guest-lane, or room-energy experience do you already have?" rows={5} />
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
            <input type="checkbox" name="training_acknowledged" value="true" className="mt-1" />
            <span>I understand approved hosts will complete EVNTSZN operating standards and training before receiving elevated access.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
            <input type="checkbox" name="terms_accepted" value="true" className="mt-1" required />
            <span>I agree to the EVNTSZN Host Network review and operating terms.</span>
          </label>
          <button type="submit" className="ev-button-primary">Submit host application</button>
        </form>

        <div className="mt-6">
          <Link href="https://hosts.evntszn.com" className="ev-button-secondary">
            Back to Host Network
          </Link>
        </div>
      </div>
    </main>
  );
}
