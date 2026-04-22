'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { useNavSession } from '@/components/navigation/useNavSession';

type NavChild = {
  href: string;
  label: string;
  detail?: string;
};

type NavGroup = {
  label: string;
  href: string;
  matches: string[];
  children: NavChild[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Discover',
    href: '/',
    matches: ['/', '/events', '/pulse', '/city', '/map'],
    children: [
      { href: '/events', label: 'Events', detail: 'Image-first event discovery with ticket-ready routes.' },
      { href: '/pulse', label: 'Pulse', detail: 'Public city energy, venue momentum, and live signals.' },
      { href: '/epl', label: 'EPL', detail: 'League highlights, clubs, standings, and schedule.' },
      { href: '/city', label: 'City Guides', detail: 'Browse nightlife, reservations, and local movement by market.' },
    ],
  },
  {
    label: 'Programs',
    href: '/epl',
    matches: ['/epl', '/hosts', '/partners', '/stayops'],
    children: [
      { href: '/epl', label: 'EPL', detail: 'Competitive league operations with a public front door.' },
      { href: '/hosts', label: 'Curator Network', detail: 'Approved network operators running EVNTSZN-led nights.' },
      { href: '/partners', label: 'Partner Program', detail: 'Independent operators using EVNTSZN as their platform.' },
      { href: '/stayops', label: 'StayOps', detail: 'Premium short-term rental revenue operations linked to city demand.' },
    ],
  },
  {
    label: 'Services',
    href: '/reserve',
    matches: ['/reserve', '/crew', '/link', '/sponsors', '/venue', '/venues', '/venue-program'],
    children: [
      { href: '/reserve', label: 'Reserve', detail: 'Premium booking, table holds, and waitlist control.' },
      { href: '/crew', label: 'Crew', detail: 'Trusted event service marketplace with clear pricing.' },
      { href: '/link', label: 'Link', detail: 'Conversion-ready pages for events, offers, and profile traffic.' },
      { href: '/sponsors', label: 'Sponsors', detail: 'Brand placement across events, Pulse, venues, and EPL.' },
      { href: '/venue', label: 'Venue', detail: 'Venue growth, reserve activation, and operator onboarding.' },
    ],
  },
  {
    label: 'For Guests',
    href: '/enter',
    matches: ['/enter', '/account', '/support'],
    children: [
      { href: '/events', label: 'Find Events', detail: 'Browse what is actually worth going to next.' },
      { href: '/reserve', label: 'Book Reserve', detail: 'Open a calm, premium reservation flow.' },
      { href: '/pulse', label: 'Follow Pulse', detail: 'See where the city is actually moving.' },
      { href: '/enter', label: 'Member Entry', detail: 'Tickets, bookings, saved plans, and account access.' },
    ],
  },
  {
    label: 'Operate',
    href: '/operate',
    matches: ['/operate', '/organizer', '/venue', '/ops', '/city-office', '/admin-login'],
    children: [
      { href: '/operate', label: 'Operations Overview', detail: 'See every operational lane in one clear map.' },
      { href: '/organizer', label: 'Partner Workspace', detail: 'Run self-operated event workflows and ticketing.' },
      { href: '/venue', label: 'Venue System', detail: 'Activate venue growth, reserve, and intake workflows.' },
      { href: '/epl', label: 'League Operations', detail: 'Follow EPL public operations and admin entry points.' },
      { href: '/admin-login?next=/ops', label: 'Internal Access', detail: 'Operator, venue, city office, and admin entry.' },
    ],
  },
];

function matchesPath(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => {
    if (candidate === '/') return pathname === '/';
    return pathname === candidate || pathname.startsWith(`${candidate}/`) || pathname.startsWith(`${candidate}?`);
  });
}

function DesktopGroup({
  group,
  active,
}: {
  group: NavGroup;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={group.href}
        className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
          active
            ? 'bg-white text-black'
            : 'text-white/64 hover:bg-white/6 hover:text-white'
        }`}
      >
        {group.label}
      </Link>
      {open ? (
        <div className="absolute left-0 top-full mt-3 w-[22rem] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b12]/95 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {group.children.map((item) => (
            <Link
              key={`${group.label}-${item.href}`}
              href={item.href}
              className="block rounded-[22px] px-4 py-3 transition hover:bg-white/6"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/82">{item.label}</div>
              {item.detail ? <div className="mt-1 text-sm leading-6 text-white/52">{item.detail}</div> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PublicNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useNavSession();
  const signInHref = useMemo(() => `/enter?next=${encodeURIComponent(pathname || '/')}`, [pathname]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(5,5,7,0.88)] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-[var(--public-nav-height)] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="mr-2 flex items-center" onClick={() => setMobileOpen(false)}>
            <span className="text-xl font-black tracking-[0.16em] text-white md:text-2xl">EVNTSZN</span>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {NAV_GROUPS.map((group) => (
              <DesktopGroup
                key={group.label}
                group={group}
                active={matchesPath(pathname, group.matches)}
              />
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session.signedIn ? (
            <Link
              href={session.dashboardHref || '/account'}
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {session.dashboardLabel || 'Account'}
            </Link>
          ) : null}
          {session.signedIn ? (
            <form action={session.signOutHref} method="POST">
              <button
                type="submit"
                className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                Sign Out
              </button>
            </form>
          ) : null}
          <Link
            href={session.signedIn ? (session.dashboardHref || '/account') : signInHref}
            className="rounded-full bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:opacity-92"
          >
            {session.signedIn ? 'Enter' : 'Sign In / Enter'}
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-white xl:hidden"
          aria-label="Toggle navigation"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
            />
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-white/10 bg-[#0c0c15] p-6 shadow-2xl xl:hidden">
          <div className="space-y-5">
            {NAV_GROUPS.map((group) => (
              <section key={group.label} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <Link
                  href={group.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-[0.22em] text-white"
                >
                  {group.label}
                </Link>
                <div className="mt-4 grid gap-3">
                  {group.children.map((item) => (
                    <Link
                      key={`${group.label}-${item.href}`}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/78">{item.label}</div>
                      {item.detail ? <div className="mt-1 text-sm leading-6 text-white/52">{item.detail}</div> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 flex gap-4 border-t border-white/8 pt-6">
            {session.signedIn ? (
              <Link
                href={session.dashboardHref || '/account'}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white"
              >
                {session.dashboardLabel || 'Account'}
              </Link>
            ) : null}
            {session.signedIn ? (
              <form action={session.signOutHref} method="POST" className="flex-1">
                <button type="submit" className="w-full rounded-xl bg-white py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  Sign Out
                </button>
              </form>
            ) : (
              <Link
                href={signInHref}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl bg-white py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black"
              >
                Sign In / Enter
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
