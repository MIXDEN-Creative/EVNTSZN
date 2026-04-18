import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";
import { getPlatformViewer } from "@/lib/evntszn";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Account Hub | EVNTSZN",
  description: "Open your EVNTSZN member account for tickets, saved events, league access, and the surfaces tied to your profile.",
  alternates: {
    canonical: `${getAppOrigin()}/account`,
  },
  openGraph: {
    title: "EVNTSZN Account Hub",
    description: "Open your EVNTSZN member account for tickets, saved events, league access, and the surfaces tied to your profile.",
    url: `${getAppOrigin()}/account`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Account Hub",
    description: "Open your EVNTSZN member account for tickets, saved events, league access, and the surfaces tied to your profile.",
  },
};

function buildQuickLinks(viewer: Awaited<ReturnType<typeof getPlatformViewer>>) {
  const classification = viewer.operatorProfile?.organizer_classification;
  
  const attendeeLinks = [
    {
      title: "Discover",
      body: "Browse public events, city plans, and nightlife picks.",
      href: `${getWebOrigin()}/`,
      label: "Open discovery",
    },
    {
      title: "EPL",
      body: "Standings, registration, and season movement.",
      href: `${getEplOrigin()}/`,
      label: "Open EPL",
    },
  ];

  if (viewer.user) {
    attendeeLinks.push({
      title: "Official tickets",
      body: "Open your live ticket wallet with status, secure entry, and event access.",
      href: "/account/tickets",
      label: "Open tickets",
    });
    attendeeLinks.push({
      title: "Pulse Feed",
      body: "Track public event movement, venue momentum, and live city signals.",
      href: "/account/pulse",
      label: "Open Pulse",
    });
    attendeeLinks.push({
      title: "Messages",
      body: "See confirmations, updates, and account-linked replies in one thread view.",
      href: "/account/messages",
      label: "Open messages",
    });
    attendeeLinks.push({
      title: "Track orders",
      body: "Follow purchases and order status.",
      href: "/orders/track",
      label: "Track orders",
    });
    attendeeLinks.push({
      title: "Support",
      body: "Open the support desk for any account or event issues.",
      href: `${getWebOrigin()}/support`,
      label: "Get support",
    });
    attendeeLinks.push(
      {
        title: "EVNTSZN Link",
        body: "Manage your public curator conversion page, offers, and event promotion.",
        href: "/account/link",
        label: "Open Link",
      },
      {
        title: "Crew marketplace",
        body: "Publish your crew profile and review booking requests.",
        href: "/account/crew",
        label: "Manage crew",
      },
      {
        title: "EVNTSZN Nodes",
        body: "Manage discovery points, destination routing, and live node activity.",
        href: "/account/nodes",
        label: "Manage nodes",
      },
    );
  } else {
    attendeeLinks.push(
      {
        title: "Pulse Feed",
        body: "Preview public city signals, then sign in for account-level access.",
        href: `${getAppOrigin()}/account/login?next=/account/pulse`,
        label: "Open Pulse",
      },
      {
        title: "Sign in",
        body: "Open your member account for tickets and orders.",
        href: `${getAppOrigin()}/account/login?next=/account`,
        label: "Sign in",
      },
      {
        title: "Create account",
        body: "Join EVNTSZN for one clean path into everything.",
        href: `${getAppOrigin()}/account/register?next=/account`,
        label: "Create account",
      }
    );
  }

  const operationalLinks = [];

  if (viewer.isPlatformAdmin) {
    operationalLinks.push(
      {
        title: "Control center",
        body: "Approvals, sponsors, issues, and health.",
        href: "/epl/admin/control-center",
        label: "Open control center",
      },
      {
        title: "Hiring pipeline",
        body: "Review opportunities and hiring decisions.",
        href: "/epl/admin/hiring",
        label: "Open hiring",
      },
      {
        title: "Events desk",
        body: "Manage EVNTSZN and EPL event inventory.",
        href: "/epl/admin/events",
        label: "Open events",
      },
      {
        title: "Pulse feed",
        body: "Moderate public and internal Pulse signals.",
        href: "/epl/admin/pulse",
        label: "Open Pulse",
      },
      {
        title: "Messaging",
        body: "Run public-safe and internal threads without leaving admin.",
        href: "/epl/admin/messages",
        label: "Open messaging",
      }
    );
  }

  if (viewer.operatorProfile?.is_active && viewer.operatorProfile.surface_access.includes("ops")) {
    operationalLinks.push({
      title: "Operations",
      body: "Scoped operator workspace for event execution.",
      href: "/ops",
      label: "Open ops",
    });
    operationalLinks.push({
      title: "Growth earnings",
      body: "Managed accounts, recurring earnings, and recent monetization events tied to your login.",
      href: "/ops/growth",
      label: "Open growth earnings",
    });
    operationalLinks.push({
      title: "Internal Pulse",
      body: "Review internal ops signals, assignments, and reserve pressure.",
      href: "/ops/pulse",
      label: "Open internal Pulse",
    });
    operationalLinks.push({
      title: "Internal messaging",
      body: "Coordinate internal work without mixing public conversations.",
      href: "/ops/messages",
      label: "Open internal messages",
    });
  }

  if (
    viewer.isPlatformAdmin ||
    (
      viewer.operatorProfile?.is_active &&
      viewer.operatorProfile.dashboard_access.includes("city") &&
      (viewer.operatorProfile.city_scope.length > 0 || Boolean(viewer.profile?.city))
    )
  ) {
    operationalLinks.push({
      title: "City office",
      body: "Run city-scoped approvals and revenue.",
      href: "/city-office",
      label: "Open city office",
    });
  }

  if (viewer.profile?.primary_role === "organizer" || viewer.isPlatformAdmin) {
    operationalLinks.push({
      title: "Partner workspace",
      body: "Manage event-ready workflows and activity.",
      href: "/organizer",
      label: "Open partner workspace",
    });
  }

  if (classification === "evntszn_host" || classification === "city_host") {
    operationalLinks.push(
      {
        title: "Curator network",
        body: "EVNTSZN Curator path and progression.",
        href: `${getWebOrigin()}/hosts`,
        label: "Open curator path",
      },
      {
        title: "Signal",
        body: "Requests and assignments for city support.",
        href: `${getWebOrigin()}/signal/apply`,
        label: "Open Signal",
      }
    );
  }

  if (viewer.profile?.primary_role === "venue") {
    operationalLinks.push({
      title: "Venue workspace",
      body: "Venue responsibilities and day operations.",
      href: "/venue",
      label: "Open venue",
    });
  }

  return { attendeeLinks, operationalLinks };
}

function buildRoleLanes(viewer: Awaited<ReturnType<typeof getPlatformViewer>>) {
  const lanes = [
    {
      title: "Member",
      body: "Tickets, orders, messages, Pulse, and league activity stay in the member lane.",
      href: viewer.user ? "/account/tickets" : `${getAppOrigin()}/account/login?next=/account`,
      label: viewer.user ? "Open tickets" : "Enter member lane",
      active: true,
    },
  ];

  if (viewer.profile?.primary_role === "organizer" || viewer.operatorProfile?.organizer_classification === "independent_organizer") {
    lanes.push({
      title: "Partner",
      body: "Create events, manage ticketing, and work the self-operated event lane.",
      href: "/organizer",
      label: "Open partner workspace",
      active: true,
    });
  }

  if (viewer.operatorProfile?.organizer_classification === "evntszn_host" || viewer.operatorProfile?.organizer_classification === "city_host") {
    lanes.push({
      title: "EVNTSZN Curator",
      body: "Network-led event operations, city support, and curator progression stay here.",
      href: "/ops",
      label: "Open curator ops",
      active: true,
    });
  }

  if (viewer.profile?.primary_role === "venue") {
    lanes.push({
      title: "Venue",
      body: "Reserve, event readiness, and scanner-day venue operations run from this lane.",
      href: "/venue",
      label: "Open venue workspace",
      active: true,
    });
  }

  if (viewer.operatorProfile?.dashboard_access.includes("city") || viewer.isPlatformAdmin) {
    lanes.push({
      title: "City Office",
      body: "Market-level approvals, city performance, and operational oversight stay separate from attendee tools.",
      href: "/city-office",
      label: "Open city office",
      active: true,
    });
  }

  if (viewer.isPlatformAdmin) {
    lanes.push({
      title: "HQ / Admin",
      body: "League controls, internal messaging, queues, issues, and sponsorship operations stay here.",
      href: "/epl/admin",
      label: "Open HQ admin",
      active: true,
    });
  }

  return lanes;
}

export default async function AccountPage() {
  const viewer = await getPlatformViewer().catch((error) => {
    console.error("[account] viewer load failed", error);
    return {
      user: null,
      profile: null,
      operatorProfile: null,
      isPlatformAdmin: false,
    };
  });

  const { attendeeLinks, operationalLinks } = buildQuickLinks(viewer);
  const roleLanes = buildRoleLanes(viewer);
  const accessSummary = [
    viewer.user?.email ? `Signed in as ${viewer.user.email}` : "Public member hub",
    viewer.isPlatformAdmin ? "Founder/admin override" : null,
    viewer.profile?.primary_role ? `Primary role: ${viewer.profile.primary_role}` : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-black/25 px-4 py-4 backdrop-blur-xl">
          <Link href={`${getWebOrigin()}/`} className="flex items-center gap-3" aria-label="EVNTSZN home">
            <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="44px" className="object-cover" priority />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white">EVNTSZN</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">Member account and attendee access</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-3">
            {viewer.user ? (
              <Link href="/account/logout" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                Sign out
              </Link>
            ) : (
              <Link href={`${getAppOrigin()}/account/login`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                Member sign in
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-[40px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-8 md:p-12 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#a259ff]/10 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#b899ff]">
              {viewer.user ? "Member hub" : "EVNTSZN account"}
            </div>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white md:text-7xl lg:text-8xl leading-[0.9] max-w-5xl">
              {viewer.user ? "Your member account." : "One account for everything."}
            </h1>
            <p className="mt-8 max-w-3xl text-lg md:text-xl leading-relaxed text-white/70">
              {viewer.user
                ? "Manage your tickets, orders, saved activity, and any creator tools tied to your profile from one hub."
                : "Join EVNTSZN to track your tickets, orders, and league history with one member identity."}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {accessSummary.map((item) => (
                <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/68">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-white/40 mb-6">Your Active Lanes</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roleLanes.map((lane) => (
                  <div key={lane.title} className="rounded-[28px] border border-white/10 bg-black/35 p-6">
                    <div className="text-xl font-black tracking-tight text-white">{lane.title}</div>
                    <p className="mt-3 text-sm leading-6 text-white/60">{lane.body}</p>
                    <Link href={lane.href} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90">
                      {lane.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16">
              <div className="text-sm font-bold uppercase tracking-[0.24em] text-white/40 mb-8">Member Experience</div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {attendeeLinks.map((item) => (
                  <div key={item.title} className="flex flex-col rounded-[32px] border border-white/10 bg-white/5 p-7 transition-all hover:bg-white/10 hover:border-white/20 group">
                    <div className="text-2xl font-black tracking-tight text-white group-hover:text-[#b899ff] transition-colors">{item.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-white/60 flex-1">{item.body}</p>
                    <Link
                      href={item.href}
                      className="mt-8 rounded-full bg-white px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-black transition hover:opacity-90 active:scale-[0.98]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {operationalLinks.length > 0 && (
              <div className="mt-16 pt-16 border-t border-white/10">
                <div className="text-sm font-bold uppercase tracking-[0.24em] text-[#b899ff] mb-8">Operational Surfaces</div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {operationalLinks.map((item) => (
                    <div key={item.title} className="flex flex-col rounded-[32px] border border-white/10 bg-black/40 p-7 transition-all hover:bg-white/10 hover:border-white/20 group">
                      <div className="text-xl font-bold tracking-tight text-white group-hover:text-[#b899ff] transition-colors">{item.title}</div>
                      <p className="mt-3 text-sm leading-relaxed text-white/50 flex-1">{item.body}</p>
                      <Link
                        href={item.href}
                        className="mt-8 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white/10 active:scale-[0.98]"
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
