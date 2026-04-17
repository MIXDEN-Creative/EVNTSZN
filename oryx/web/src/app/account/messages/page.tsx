import PublicPageFrame from "@/components/public/PublicPageFrame";
import MessagingClient from "@/components/messages/MessagingClient";
import { requirePlatformUser, getPlatformViewer } from "@/lib/evntszn";
import { listMessageThreads } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export default async function AccountMessagesPage() {
  await requirePlatformUser("/account/messages");
  const viewer = await getPlatformViewer();
  const threads = await listMessageThreads(viewer, "public");

  return (
    <PublicPageFrame>
      <section className="ev-public-section py-8 md:py-10">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <div className="ev-kicker">Account messaging</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">Keep confirmations, updates, and replies in one place.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            Public-safe messaging covers reservations, event updates, venue replies, and account-linked support threads. Internal ops never appears here.
          </p>
        </div>
        <div className="mt-8">
          <MessagingClient scope="public" initialThreads={threads} />
        </div>
      </section>
    </PublicPageFrame>
  );
}
