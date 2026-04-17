"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CREW_CATEGORIES, getCrewCategoryLabel } from "@/lib/platform-products";

type CrewProfile = {
  id: string;
  slug: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  category: string;
  custom_category: string | null;
  headline: string | null;
  short_bio: string | null;
  city: string | null;
  state: string | null;
  rate_amount_usd: number | null;
  rate_unit: string | null;
  availability_state: string;
  tags: string[] | null;
  request_count: number;
  is_recently_active: boolean;
  is_new_listing: boolean;
};

type CrewMarketplaceClientProps = {
  initialFilters?: {
    query?: string;
    city?: string;
    category?: string;
    availability?: string;
  };
};

export default function CrewMarketplaceClient({ initialFilters }: CrewMarketplaceClientProps) {
  const [profiles, setProfiles] = useState<CrewProfile[]>([]);
  const [query, setQuery] = useState(initialFilters?.query || "");
  const [city, setCity] = useState(initialFilters?.city || "");
  const [category, setCategory] = useState(initialFilters?.category || "");
  const [availability, setAvailability] = useState(initialFilters?.availability || "");

  async function load(next?: { query?: string; city?: string; category?: string; availability?: string }) {
    const params = new URLSearchParams();
    if (next?.query ?? query) params.set("q", next?.query ?? query);
    if (next?.city ?? city) params.set("city", next?.city ?? city);
    if (next?.category ?? category) params.set("category", next?.category ?? category);
    if (next?.availability ?? availability) params.set("availability", next?.availability ?? availability);
    const res = await fetch(`/api/evntszn/crew?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as { profiles?: CrewProfile[] };
    setProfiles(json.profiles || []);
  }

  useEffect(() => {
    void load({
      query: initialFilters?.query || "",
      city: initialFilters?.city || "",
      category: initialFilters?.category || "",
      availability: initialFilters?.availability || "",
    });
  }, [initialFilters?.availability, initialFilters?.category, initialFilters?.city, initialFilters?.query]);

  const categoryCounts = CREW_CATEGORIES.filter((entry) => entry !== "custom")
    .map((entry) => ({
      value: entry,
      label: getCrewCategoryLabel(entry),
      count: profiles.filter((profile) => profile.category === entry).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="space-y-10">
      <section className="ev-section-frame">
        <div className="ev-dashboard-hero">
        <div className="mb-5">
          <div className="ev-section-kicker">Search the marketplace</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">Search vetted creative and event support without the marketplace feeling disposable.</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <input className="ev-field" placeholder="Search DJs, creators, bartenders, curators..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="ev-field" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <select className="ev-field" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Any category</option>
            {CREW_CATEGORIES.filter((entry) => entry !== "custom").map((entry) => (
              <option key={entry} value={entry}>
                {getCrewCategoryLabel(entry)}
              </option>
            ))}
          </select>
          <select className="ev-field" value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="">Any availability</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <button type="button" onClick={() => void load()} className="ev-button-primary">
            Search
          </button>
        </div>
        {categoryCounts.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {categoryCounts.map((entry) => (
              <Link
                key={entry.value}
                href={`/crew/${entry.value}`}
                className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                  category === entry.value
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/30 text-white/72 hover:border-white/18 hover:bg-white/[0.06]"
                }`}
              >
                {entry.label} · {entry.count}
              </Link>
            ))}
          </div>
        ) : null}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <a key={profile.id} href={`/crew/${profile.slug}`} className="group rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(8,8,12,0.76)] p-6 shadow-[0_22px_52px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.06] md:p-7">
            <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                    {profile.custom_category || getCrewCategoryLabel(profile.category)}
                  </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{profile.display_name}</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${profile.availability_state === "available" ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100" : "border-white/10 bg-white/5 text-white/70"}`}>
                  {profile.availability_state === "available" ? "Available now" : profile.availability_state}
                </div>
                {profile.is_recently_active ? (
                  <div className="rounded-full border border-[#A259FF]/25 bg-[#A259FF]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e4d3ff]">
                    Recently active
                  </div>
                ) : null}
              </div>
            </div>
            {profile.headline ? <p className="mt-4 text-sm leading-6 text-white/70">{profile.headline}</p> : null}
            <div className="mt-4 text-sm text-white/52">
              {[profile.city, profile.state].filter(Boolean).join(", ") || "Location flexible"}
            </div>
            <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Trust signals</div>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-white/66">
                <div>{profile.request_count > 0 ? `${profile.request_count} booking requests have already moved through EVNTSZN.` : "Booking intake is live for this profile."}</div>
                <div>{profile.is_recently_active ? "Recently active on the platform." : "Profile is published and discoverable now."}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.rate_amount_usd ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                  ${Number(profile.rate_amount_usd || 0).toFixed(0)} / {profile.rate_unit || "event"}
                </span>
              ) : null}
              {profile.request_count > 0 ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72">
                  {profile.request_count} requests sent
                </span>
              ) : null}
              {profile.request_count >= 3 ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-500/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">
                  Most requested
                </span>
              ) : null}
              {profile.is_new_listing ? (
                <span className="rounded-full border border-sky-400/25 bg-sky-500/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100">
                  New listing
                </span>
              ) : null}
            </div>
            {profile.tags?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="ev-chip ev-chip--external">{tag}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition group-hover:translate-x-1">
              Request booking
            </div>
          </a>
        ))}

        {!profiles.length ? (
          <div className="ev-empty-state text-sm leading-6 md:col-span-2 xl:col-span-3">
            No crew matches were found yet. Try a broader city or category search.
          </div>
        ) : null}
      </section>
    </div>
  );
}
