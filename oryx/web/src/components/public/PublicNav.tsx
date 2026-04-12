"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getAppOrigin, getEplOrigin, getWebOrigin } from "@/lib/domains";
import { PUBLIC_CITIES } from "@/lib/public-cities";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  const navLinks = [
    { label: "Discover", href: `${getWebOrigin()}/` },
    { label: "Events", href: `${getWebOrigin()}/events` },
    { label: "EPL", href: `${getEplOrigin()}/` },
    { label: "Crew", href: `${getWebOrigin()}/crew` },
    { label: "Hosts", href: `${getWebOrigin()}/hosts` },
    { label: "Partners", href: `${getWebOrigin()}/partners/packages` },
    { label: "Support", href: `${getWebOrigin()}/support` },
  ];

  const accessLinks = [
    { label: "Member sign in", href: `${getAppOrigin()}/account/login`, sublabel: "Tickets, saved events, and account access" },
    { label: "Create account", href: `${getAppOrigin()}/account/register?next=/account`, sublabel: "Attendee registration and checkout history" },
    { label: "Internal access", href: `${getAppOrigin()}/admin-login`, sublabel: "Ops, scanner, city office, and admin desks" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <Link href={getWebOrigin()} className="flex items-center gap-3 transition hover:opacity-90" aria-label="EVNTSZN home">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
            <Image src="/brand/evntszn-icon.png" alt="EVNTSZN icon" fill sizes="40px" className="object-cover" priority />
          </div>
          <span className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-white">EVNTSZN</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Public Guide</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-semibold text-white/60 transition hover:text-white">
              {link.label}
            </a>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCitiesOpen((value) => !value)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition ${citiesOpen ? "text-[#caa7ff]" : "text-white/60 hover:text-white"}`}
            >
              Cities
              <svg className={`h-4 w-4 transition-transform ${citiesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {citiesOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCitiesOpen(false)} />
                <div className="absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 overflow-hidden rounded-[28px] border border-white/10 bg-black/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
                  <div className="px-4 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Explore by city</div>
                  <div className="grid gap-1">
                    {PUBLIC_CITIES.map((city) => (
                      <a
                        key={city.slug}
                        href={`${getWebOrigin()}/${city.slug}`}
                        className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        {city.name}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccessOpen((value) => !value)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition ${accessOpen ? "text-[#caa7ff]" : "text-white/60 hover:text-white"}`}
            >
              Access
              <svg className={`h-4 w-4 transition-transform ${accessOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {accessOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccessOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-4 w-[22rem] overflow-hidden rounded-[28px] border border-white/10 bg-black/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
                  <div className="px-4 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Attendee access</div>
                  <div className="grid gap-1">
                    {accessLinks.slice(0, 2).map((link) => (
                      <a key={link.label} href={link.href} className="rounded-2xl px-4 py-3 transition hover:bg-white/10">
                        <div className="text-sm font-semibold text-white">{link.label}</div>
                        <div className="mt-1 text-xs leading-5 text-white/55">{link.sublabel}</div>
                      </a>
                    ))}
                  </div>
                  <div className="mt-2 px-4 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Internal tools</div>
                  <div className="grid gap-1">
                    {accessLinks.slice(2).map((link) => (
                      <a key={link.label} href={link.href} className="rounded-2xl px-4 py-3 transition hover:bg-white/10">
                        <div className="text-sm font-semibold text-white">{link.label}</div>
                        <div className="mt-1 text-xs leading-5 text-white/55">{link.sublabel}</div>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`${getAppOrigin()}/account/login`} className="text-sm font-bold text-white/70 transition hover:text-white">
            Member sign in
          </a>
          <a href={`${getAppOrigin()}/account/register?next=/account`} className="rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90 active:scale-95">
            Create account
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
        >
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      ) : null}

      <div className={`fixed inset-x-0 top-0 z-50 h-auto origin-top transform border-b border-white/10 bg-black/95 transition-transform duration-300 lg:hidden ${open ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="p-4 pt-20">
          <div className="grid gap-2">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-base font-bold text-white">
                {link.label}
                <svg className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
            <div className="mt-4 rounded-3xl border border-white/5 bg-white/5 p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Explore Cities</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {PUBLIC_CITIES.map((city) => (
                  <a key={city.slug} href={`${getWebOrigin()}/${city.slug}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white">
                    {city.shortLabel}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Attendee access</div>
                <div className="mt-4 grid gap-3">
                  {accessLinks.slice(0, 2).map((link) => (
                    <a key={link.label} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                      <div className="text-base font-bold text-white">{link.label}</div>
                      <div className="mt-1 text-sm text-white/55">{link.sublabel}</div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#caa7ff]">Internal tools</div>
                <div className="mt-4 grid gap-3">
                  {accessLinks.slice(2).map((link) => (
                    <a key={link.label} href={link.href} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                      <div className="text-base font-bold text-white">{link.label}</div>
                      <div className="mt-1 text-sm text-white/55">{link.sublabel}</div>
                    </a>
                  ))}
                </div>
              </div>
              <a href={`${getAppOrigin()}/account/login`} className="flex items-center justify-center rounded-2xl border border-white/10 py-4 text-base font-bold text-white">
                Member sign in
              </a>
              <a href={`${getAppOrigin()}/account/register?next=/account`} className="flex items-center justify-center rounded-2xl bg-white py-4 text-base font-black text-black">
                Create account
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
