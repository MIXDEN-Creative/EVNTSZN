// src/components/public/PublicNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { getReserveOrigin } from '@/lib/domains';

// Assuming these are available constants or can be inferred
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/epl', label: 'EPL' },
  { href: '/link', label: 'Link' },
  { href: '/crew', label: 'Crew' },
  { href: getReserveOrigin(), label: 'Reserve' },
  { href: '/venue', label: 'Venue' },
  { href: '/partners', label: 'Partners' },
];

const SECONDARY_NAV_ITEMS = [
  { href: '/hosts/apply', label: 'Apply as Host' },
  { href: '/organizer/apply', label: 'Apply as Organizer' },
];

const AUTH_NAV_ITEMS = [
  { href: '/auth/login', label: 'Log In' },
  { href: '/auth/signup', label: 'Sign Up' },
];

const isActive = (href: string, pathname: string) => {
  if (href === '/' && pathname === '/') return true;
  if (href.startsWith("http")) return pathname.startsWith("/reserve");
  return pathname.startsWith(href) && href !== '/';
};

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-lg py-4 px-6 shadow-lg border-b border-white/10">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">E</div>
            <span className="text-xl font-bold text-white">EVNTSZN</span>
          </Link>
          <div className="hidden md:flex space-x-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-gray-300 hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href, pathname) ? 'text-purple-400' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {AUTH_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                item.label === 'Sign Up'
                  ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                  : 'text-white hover:bg-white/10 border border-white/20'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {/* Mobile Menu Button would go here */}
      </div>
    </nav>
  );
}
