import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAppOrigin, getEplOrigin, getHostsOrigin, getWebOrigin } from "@/lib/domains";
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
  const links = [
    {
      title: "Discover",
      body: "Go straight into public events, city plans, nightlife picks, and what is worth going to next.",
      href: `${getWebOrigin()}/`,
      label: "Open discovery",
    },
    {
      title: "EPL",
      body: "Jump into the league surface for standings, registration, opportunities, and season movement.",
      href: `${getEplOrigin()}/`,
      label: "Open EPL",
    },
  ];

  if (!viewer.user) {
    links.push(
      {
        title: "Sign in",
        body: "Open your member account for tickets, orders, saved plans, and league follow-up.",
        href: `${getAppOrigin()}/account/login?next=/account`,
        label: "Sign in",
      },
      {
        title: "Create account",
        body: "Start your attendee account and keep one clean path into discovery, tickets, and league activity.",
        href: `${getAppOrigin()}/account/login?mode=signup&next=/account`,
        label: "Create account",
      },
      {
        title: "Host Network",
        body: "If you are applying to host events with EVNTSZN, start from the host path instead of the member account flow.",
        href: `${getHostsOrigin()}/`,
        label: "Explore Host Network",
      },
    );

    return links;
  }

  links.push({
    title: "Track orders",
    body: "Follow purchases, confirmations, and order status without leaving the account surface.",
    href: "/orders/track",
    label: "Track orders",
  });

  links.push({
    title: "Support",
    body: "Open the support desk for ticketing, login, event, scanner, sponsor, or website issues with the right context attached.",
    href: `${getWebOrigin()}/support`,
    label: "Get support",
  });

  if (viewer.isPlatformAdmin) {
    links.push(
      {
        title: "Control center",
        body: "Move into the founder/admin command center for approvals, sponsors, issues, and daily operating health.",
        href: "/epl/admin/control-center",
        label: "Open control center",
      },
      {
        title: "Hiring pipeline",
        body: "Review EPL opportunities, applications, interviews, and final hiring decisions from one protected surface.",
        href: "/epl/admin/hiring",
        label: "Open hiring",
      },
      {
        title: "Events desk",
        body: "Create EVNTSZN and EPL events, publish them into discovery, and keep league event setup moving without code edits.",
        href: "/epl/admin/events",
        label: "Open events",
      },
    );
  }

  if (viewer.operatorProfile?.is_active && viewer.operatorProfile.surface_access.includes("ops")) {
    links.push({
      title: "Operations",
      body: "Open your scoped operator workspace for EVNTSZN execution, approvals, and assigned operating access.",
      href: "/ops",
      label: "Open ops",
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
    links.push({
      title: "City office",
      body: "Run city-scoped approvals, operators, revenue, and upcoming event activity without crossing into markets you do not own.",
      href: "/city-office",
      label: "Open city office",
    });
  }

  if (viewer.profile?.primary_role === "organizer" || viewer.isPlatformAdmin) {
    links.push({
      title: "Organizer workspace",
      body: "Manage event operations, organizer activity, and event-ready workflows from the protected organizer surface.",
      href: "/organizer",
      label: "Open organizer",
    });
  }

  if (viewer.isPlatformAdmin) {
    links.push({
      title: "Event desk",
      body: "Create native events, manage ticket releases, update run of show, and keep discovery inventory moving from one protected desk.",
      href: "/epl/admin/events",
      label: "Open event desk",
    });
  }

  if (classification === "evntszn_host" || classification === "city_host") {
    links.push(
      {
        title: "Host network",
        body: "Move through the EVNTSZN Host network path with city support, operating progression, and the right internal next steps.",
        href: `${getHostsOrigin()}/`,
        label: "Open host path",
      },
      {
        title: "Signal",
        body: "Signal requests and assignments stay separate from general organizer workflows. Use the Signal path when you are supporting controlled activation or city support.",
        href: `${getWebOrigin()}/signal/apply`,
        label: "Open Signal",
      },
      {
        title: "Ambassador",
        body: "Ambassador is a separate city-growth program for visibility and referral pull, not the same thing as Signal or host ops.",
        href: `${getWebOrigin()}/ambassador/apply`,
        label: "Open Ambassador",
      },
    );
  }

  if (classification === "independent_organizer") {
    links.push(
      {
        title: "Sponsor interest",
        body: "If you want sponsor or partner support around your own events, start from the sponsor package and inquiry path instead of the host network surface.",
        href: `${getWebOrigin()}/partners/packages`,
        label: "Open sponsor options",
      },
      {
        title: "Apply to Host Network",
        body: "Independent Organizers stay on the external operator track by default. Use the Host Network only if you want to apply into the EVNTSZN internal network path.",
        href: `${getHostsOrigin()}/`,
        label: "Explore host upgrade",
      },
    );
  }

  if (viewer.profile?.primary_role === "venue") {
    links.push({
      title: "Venue workspace",
      body: "Move into the venue surface for owned event activity, venue responsibilities, and event-day operations.",
      href: "/venue",
      label: "Open venue",
    });
  }

  links.push({
    title: "Log out",
    body: "Sign out cleanly when you are done.",
    href: "/account/logout",
    label: "Log out",
  });

  return links;
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

  const quickLinks = buildQuickLinks(viewer);
  const accessSummary = [
    viewer.user?.email ? `Signed in as ${viewer.user.email}` : "Public member hub",
    viewer.isPlatformAdmin ? "Founder/admin override" : null,
    viewer.profile?.primary_role ? `Primary role: ${viewer.profile.primary_role}` : null,
    viewer.operatorProfile?.organizer_classification ? `Classification: ${String(viewer.operatorProfile.organizer_classification).replace(/_/g, " ")}` : null,
    viewer.operatorProfile?.network_status ? `Network status: ${String(viewer.operatorProfile.network_status).replace(/_/g, " ")}` : null,
    viewer.operatorProfile?.job_title ? `Job: ${viewer.operatorProfile.job_title}` : null,
    viewer.operatorProfile?.city_scope?.length ? `City scope: ${viewer.operatorProfile.city_scope.join(", ")}` : viewer.profile?.city ? `City: ${viewer.profile.city}` : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
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
            <Link href={`${getWebOrigin()}/`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
              Public homepage
            </Link>
            <Link href={`${getAppOrigin()}/account/login`} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
              Member sign in
            </Link>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
            {viewer.user ? "Member hub" : "EVNTSZN account"}
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
            {viewer.user
              ? "Move from your member account into the right EVNTSZN surface fast."
              : "Sign in, create your account, and move straight into tickets, orders, and league access."}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/74">
            {viewer.user
              ? "Use this hub for discovery, order tracking, league activity, and any protected work surfaces already tied to your account."
              : "Public discovery stays open. Your tickets, orders, saved activity, and attendee access all route through this member hub. Internal staff access stays separate."}
          </p>

          {accessSummary.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {accessSummary.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/78">
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xl font-bold tracking-tight text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/72">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
