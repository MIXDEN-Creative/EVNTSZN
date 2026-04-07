"use client";

import Link from "next/link";
import { useState } from "react";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";
import { PUBLIC_CITIES } from "@/lib/public-cities";

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: "Discover", href: `${getWebOrigin()}/` },
    { label: "Cities", href: `${getWebOrigin()}/#cities` },
    { label: "EPL", href: `${getEplOrigin()}/` },
    { label: "Store", href: `${getEplOrigin()}/store` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/72 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-white">
          EVNTSZN
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-white/78 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`${getAppOrigin()}/account/login`} className="text-sm font-medium text-white/78 transition hover:text-white">
            Sign In
          </a>
          <a href={`${getAppOrigin()}/account/login?next=/account`} className="ev-button-primary px-4 py-2 text-sm">
            Create Account
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white lg:hidden"
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-black/92 px-4 py-4 lg:hidden">
          <div className="grid gap-3">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                {link.label}
              </a>
            ))}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Cities</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PUBLIC_CITIES.map((city) => (
                  <a key={city.slug} href={`${getWebOrigin()}/${city.slug}`} className="ev-chip ev-chip--external">
                    {city.shortLabel}
                  </a>
                ))}
              </div>
            </div>
            <a href={`${getAppOrigin()}/account/login`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Sign In
            </a>
            <a href={`${getAppOrigin()}/account/login?next=/account`} className="ev-button-primary">
              Create Account
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
