import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import SupportPageClient from "./SupportPageClient";
import { getPlatformViewer } from "@/lib/evntszn";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Support | EVNTSZN",
  description: "Get help with EVNTSZN tickets, login, events, scanner issues, sponsors, staff workflows, and platform questions.",
  alternates: {
    canonical: `${getWebOrigin()}/support`,
  },
  openGraph: {
    title: "EVNTSZN Support",
    description: "Get help with EVNTSZN tickets, login, events, scanner issues, sponsors, staff workflows, and platform questions.",
    url: `${getWebOrigin()}/support`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Support",
    description: "Get help with EVNTSZN tickets, login, events, scanner issues, sponsors, staff workflows, and platform questions.",
  },
};

export default async function SupportPage() {
  const viewer = await getPlatformViewer().catch(() => ({
    user: null,
    profile: null,
    operatorProfile: null,
    isPlatformAdmin: false,
  }));

  const defaultRole = viewer.operatorProfile?.role_key || viewer.profile?.primary_role || "guest";

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.16),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
          <div className="ev-kicker">Support desk</div>
          <h1 className="ev-title max-w-5xl">Need help? Send it to the right team without losing context.</h1>
          <p className="ev-subtitle max-w-2xl">
            Support requests can include events, ticketing, login, scanner, sponsor, staff, office, and payment issues so operations can act without a long back-and-forth.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <SupportPageClient
          signedIn={Boolean(viewer.user)}
          defaultName={viewer.profile?.full_name || viewer.user?.user_metadata?.full_name || ""}
          defaultEmail={viewer.user?.email || ""}
          defaultRole={String(defaultRole)}
        />
      </section>
    </PublicPageFrame>
  );
}
