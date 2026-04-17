// src/components/public/PublicNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { getReserveOrigin } from '@/lib/domains';

const NAV_ITEMS = [
  { href: '/events', label: 'Events' },
  { href: '/epl', label: 'EPL' },
  { href: '/link', label: 'Link' },
  { href: '/crew', label: 'Crew' },
  { href: getReserveOrigin(), label: 'Reserve' },
  { href: '/venue', label: 'Venue' },
  { href: '/partners', label: 'Partners' },
];

const BUILD_ITEMS = [
  { href: '/hosts/apply', label: 'Apply as Host' },
  { href: '/organizer/apply', label: 'Apply as Organizer' },
  { href: '/partners', label: 'Partner Program' },
];

const AUTH_NAV_ITEMS = [
  { href: '/account/login', label: 'Log In' },
  { href: '/account/register', label: 'Sign Up' },
];

const isActive = (href: string, pathname: string) => {
  if (href === '/' && pathname === '/') return true;
  if (href.startsWith("http")) return pathname.startsWith("/reserve");
  return pathname.startsWith(href) && href !== '/';
};

export default function PublicNav() {
  const pathname = usePathname();
  const [buildOpen, setBuildOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-lg py-4 px-6 shadow-lg border-b border-white/10">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-10 flex items-center" onClick={() => setMobileOpen(false)}>
            <span className="text-2xl font-black tracking-tighter text-white">EVNTSZN</span>
          </Link>
          <div className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                  isActive(item.href, pathname) 
                    ? 'text-white bg-white/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <button 
              onMouseEnter={() => setBuildOpen(true)}
              onClick={() => setBuildOpen(!buildOpen)}
              className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white px-4 py-2 transition-all"
            >
              Build ↓
            </button>
            {buildOpen && (
              <div 
                onMouseLeave={() => setBuildOpen(false)}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c15] p-2 shadow-2xl backdrop-blur-xl"
              >
                {BUILD_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-white/10" />

          {AUTH_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                item.label === 'Sign Up'
                  ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                  : 'text-white hover:bg-white/10 border border-white/20'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0c0c15] border-b border-white/10 p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white py-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Build on EVNTSZN</div>
            <div className="grid gap-4">
              {BUILD_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-bold uppercase tracking-widest text-white/60"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex gap-4">
            {AUTH_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex-1 text-center py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                  item.label === 'Sign Up' ? 'bg-white text-black' : 'border border-white/20 text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
