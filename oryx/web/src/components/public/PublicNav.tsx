// src/components/public/PublicNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { getAppOrigin, getEplOrigin, getHostsOrigin, getOpsOrigin, getReserveOrigin, getWebOrigin } from '@/lib/domains';
import { useNavSession } from '@/components/navigation/useNavSession';

const PRIMARY_NAV_ITEMS = [
  { href: `${getWebOrigin()}/`, path: '/', label: 'Discover' },
  { href: `${getWebOrigin()}/events`, path: '/events', label: 'Events' },
  { href: `${getWebOrigin()}/pulse`, path: '/pulse', label: 'Pulse' },
  { href: `${getReserveOrigin()}/`, path: '/reserve', label: 'Reserve' },
  { href: `${getWebOrigin()}/crew`, path: '/crew', label: 'Crew' },
  { href: `${getEplOrigin()}/`, path: '/epl', label: 'EPL' },
  { href: `${getWebOrigin()}/link`, path: '/link', label: 'Link' },
  { href: `${getOpsOrigin()}/venue`, path: '/venue', label: 'Venue' },
  { href: `${getWebOrigin()}/sponsors`, path: '/sponsors', label: 'Sponsors' },
];

const BUILD_ITEMS = [
  { href: `${getHostsOrigin()}/apply`, label: 'Become a Curator' },
  { href: `${getWebOrigin()}/organizer/apply`, label: 'Become a Partner' },
  { href: `${getOpsOrigin()}/venue/agreement`, label: 'Bring a Venue' },
  { href: `${getWebOrigin()}/sponsors`, label: 'Sponsor with EVNTSZN' },
];

const OPERATE_ITEMS = [
  { href: `${getWebOrigin()}/hosts`, label: 'Curator lane', detail: 'Network-based event operators' },
  { href: `${getWebOrigin()}/organizer`, label: 'Partner lane', detail: 'Self-operated event businesses' },
  { href: `${getWebOrigin()}/venue`, label: 'Venue ops', detail: 'Reserve, bookings, and nightlife operations' },
  { href: `${getEplOrigin()}/`, label: 'EPL league', detail: 'Prime League public and admin surfaces' },
];

const isActive = (path: string, pathname: string) => {
  if (path === '/reserve') return pathname.startsWith('/reserve');
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
};

export default function PublicNav() {
  const pathname = usePathname();
  const [buildOpen, setBuildOpen] = useState(false);
  const [operateOpen, setOperateOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useNavSession();
  const signInHref = useMemo(() => `${getAppOrigin()}/account/login?next=${encodeURIComponent(pathname || '/')}`, [pathname]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(5,5,7,0.9)] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-[var(--public-nav-height)] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Link href={getWebOrigin()} className="mr-2 flex items-center" onClick={() => setMobileOpen(false)}>
            <span className="text-xl font-black tracking-[0.16em] text-white md:text-2xl">EVNTSZN</span>
          </Link>
          <div className="hidden xl:flex items-center gap-1">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                  isActive(item.path, pathname)
                    ? 'bg-white text-black'
                    : 'text-white/62 hover:bg-white/6 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="relative">
              <button
                onMouseEnter={() => setOperateOpen(true)}
                onClick={() => setOperateOpen(!operateOpen)}
                className="rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/62 transition hover:bg-white/6 hover:text-white"
              >
                Operate
              </button>
              {operateOpen && (
                <div
                  onMouseLeave={() => setOperateOpen(false)}
                  className="absolute left-0 mt-2 w-80 overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0c15] p-2 shadow-2xl backdrop-blur-xl"
                >
                  {OPERATE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl px-4 py-3 transition hover:bg-white/6"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">{item.label}</div>
                      <div className="mt-1 text-sm text-white/55">{item.detail}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              onMouseEnter={() => setBuildOpen(true)}
              onClick={() => setBuildOpen(!buildOpen)}
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/74 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              Build
            </button>
            {buildOpen && (
              <div
                onMouseLeave={() => setBuildOpen(false)}
                className="absolute right-0 mt-2 w-64 overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0c15] p-2 shadow-2xl backdrop-blur-xl"
              >
                {BUILD_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/68 transition hover:bg-white/6 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {session.signedIn ? (
            <Link href={`${getAppOrigin()}${session.dashboardHref || "/account"}`} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
              {session.dashboardLabel || "Dashboard"}
            </Link>
          ) : null}
          {session.signedIn ? (
            <form action={session.signOutHref} method="POST">
              <button type="submit" className="rounded-full bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:opacity-92">
                Sign Out
              </button>
            </form>
          ) : (
            <Link href={signInHref} className="rounded-full bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:opacity-92">
              Sign In / Enter
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-white xl:hidden"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full max-h-[80vh] overflow-y-auto border-b border-white/10 bg-[#0c0c15] p-6 shadow-2xl xl:hidden">
          <div className="grid gap-2">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 border-t border-white/8 pt-6">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Operate</div>
            <div className="grid gap-3">
              {OPERATE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/76">{item.label}</div>
                  <div className="mt-1 text-sm text-white/52">{item.detail}</div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-white/8 pt-6">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Build</div>
            <div className="grid gap-4">
              {BUILD_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-4 border-t border-white/8 pt-6">
            {session.signedIn ? (
              <Link
                href={`${getAppOrigin()}${session.dashboardHref || "/account"}`}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white"
              >
                {session.dashboardLabel || "Dashboard"}
              </Link>
            ) : null}
            {session.signedIn ? (
              <form action={session.signOutHref} method="POST" className="flex-1">
                <button type="submit" className="w-full rounded-xl bg-white py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  Sign Out
                </button>
              </form>
            ) : (
              <Link href={signInHref} onClick={() => setMobileOpen(false)} className="flex-1 rounded-xl bg-white py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-black">
                Sign In / Enter
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
