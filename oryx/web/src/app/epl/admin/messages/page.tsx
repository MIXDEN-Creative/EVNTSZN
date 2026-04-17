import MessagingClient from "@/components/messages/MessagingClient";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPlatformViewer } from "@/lib/evntszn";
import { listMessageThreads } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/messages");
  const viewer = await getPlatformViewer();
  const threads = await listMessageThreads(viewer, "internal");

  return (
    <main className="space-y-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Messaging control</div>
            <h1 className="ev-title">Public-safe threads stay separated from internal operations.</h1>
            <p className="ev-subtitle">
              Use this desk for internal routing, approvals, reserve escalation, sponsor coordination, crew coverage, and operational follow-through.
            </p>
          </div>
        </div>
      </section>
      <MessagingClient scope="internal" initialThreads={threads} canManage />
    </main>
  );
}
