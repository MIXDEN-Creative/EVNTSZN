import PulseFeedClient from "@/components/pulse/PulseFeedClient";
import PulseModerationConsole from "@/components/pulse/PulseModerationConsole";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getInternalPulseFeed, getPublicPulseFeed } from "@/lib/pulse";

export const dynamic = "force-dynamic";

export default async function AdminPulsePage() {
  await requireAdminPermission("admin.manage", "/epl/admin/pulse");
  const [publicItems, internalItems] = await Promise.all([getPublicPulseFeed(), getInternalPulseFeed()]);

  return (
    <main className="space-y-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Pulse control</div>
            <h1 className="ev-title">Run both sides of Pulse without mixing visibility.</h1>
            <p className="ev-subtitle">
              Public Pulse stays discovery-safe. Internal Pulse stays restricted to bolt-level and operational roles. Admin can moderate both from here.
            </p>
          </div>
        </div>
      </section>

      <section className="ev-panel p-6">
        <div className="ev-section-kicker">Public Pulse</div>
        <div className="mt-3 text-2xl font-black text-white">Public-safe city and discovery feed.</div>
        <div className="mt-6">
          <PulseFeedClient scope="public" initialItems={publicItems} canPost canManage manageVisibility />
        </div>
      </section>

      <section className="ev-panel p-6">
        <div className="ev-section-kicker">Internal Pulse</div>
        <div className="mt-3 text-2xl font-black text-white">Internal ops feed for reserve, staffing, and desk-linked action.</div>
        <div className="mt-6">
          <PulseFeedClient scope="internal" initialItems={internalItems} canPost canManage />
        </div>
      </section>

      <section className="ev-panel p-6">
        <div className="ev-section-kicker">Pulse moderation</div>
        <div className="mt-3 text-2xl font-black text-white">Assign moderators, review flags, mute or suspend users, and audit every action.</div>
        <div className="mt-6">
          <PulseModerationConsole />
        </div>
      </section>
    </main>
  );
}
