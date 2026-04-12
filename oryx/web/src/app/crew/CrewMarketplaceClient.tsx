"use client";

import { useEffect, useState } from "react";

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
  rate_amount_cents: number | null;
  rate_unit: string | null;
  availability_state: string;
  tags: string[] | null;
  request_count: number;
  is_recently_active: boolean;
  is_new_listing: boolean;
};

export default function CrewMarketplaceClient() {
  const [profiles, setProfiles] = useState<CrewProfile[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");

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
    void load();
  }, []);

  return (
    <div className="space-y-10">
      <section className="ev-panel p-6 md:p-8">
        <div className="mb-5">
          <div className="ev-section-kicker">Search the marketplace</div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Filter the right talent fast.</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <input className="ev-field" placeholder="Search hosts, DJs, security, content..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <input className="ev-field" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <input className="ev-field" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
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
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <a key={profile.id} href={`/${profile.slug}`} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:bg-white/[0.06] md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                  {profile.custom_category || profile.category}
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
            <div className="mt-4 flex flex-wrap gap-2">
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
            {profile.rate_amount_cents ? (
              <div className="mt-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                ${(profile.rate_amount_cents / 100).toFixed(0)} / {profile.rate_unit || "event"}
              </div>
            ) : null}
            {profile.tags?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="ev-chip ev-chip--external">{tag}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
              Request booking
            </div>
          </a>
        ))}

        {!profiles.length ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-white/60 md:col-span-2 xl:col-span-3">
            No crew matches were found yet. Try a broader city or category search.
          </div>
        ) : null}
      </section>
    </div>
  );
}
