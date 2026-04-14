"use client";

import { useEffect, useState } from "react";
import { CREW_CATEGORIES, getCrewCategoryLabel } from "@/lib/platform-products";

type CrewProfile = {
  id?: string;
  slug?: string;
  display_name?: string | null;
  category?: string;
  custom_category?: string | null;
  headline?: string | null;
  short_bio?: string | null;
  city?: string | null;
  state?: string | null;
  rate_amount_cents?: number | null;
  rate_unit?: string | null;
  availability_state?: string;
  accepts_booking_requests?: boolean;
  booking_fee_cents?: number | null;
  portfolio_links?: string[];
  portfolio_images?: string[];
  tags?: string[];
  instagram_url?: string | null;
  website_url?: string | null;
  contact_email?: string | null;
  status?: "draft" | "published";
  worked_event_ids?: string[];
};

type AvailableEvent = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  state: string | null;
  start_at: string;
};

type BookingRequest = {
  id: string;
  requested_by_name: string;
  requested_by_email: string;
  requested_role: string | null;
  event_name: string | null;
  event_date: string | null;
  city: string | null;
  state: string | null;
  message: string | null;
  status: string;
  flat_booking_fee_cents: number | null;
  created_at: string;
};

const DEFAULT_PROFILE: CrewProfile = {
  display_name: "",
  category: "host",
  custom_category: "",
  headline: "",
  short_bio: "",
  city: "",
  state: "",
  rate_amount_cents: null,
  rate_unit: "event",
  availability_state: "available",
  accepts_booking_requests: true,
  booking_fee_cents: null,
  portfolio_links: [""],
  portfolio_images: [""],
  tags: [""],
  instagram_url: "",
  website_url: "",
  contact_email: "",
  status: "draft",
};

export default function CrewManagerClient() {
  const [profile, setProfile] = useState<CrewProfile>(DEFAULT_PROFILE);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [profileRes, requestsRes] = await Promise.all([
      fetch("/api/evntszn/crew?mine=1", { cache: "no-store" }),
      fetch("/api/evntszn/crew/requests", { cache: "no-store" }),
    ]);
    const profileJson = (await profileRes.json()) as { profile?: CrewProfile; availableEvents?: AvailableEvent[]; error?: string };
    const requestsJson = (await requestsRes.json()) as { requests?: BookingRequest[]; error?: string };
    if (profileRes.ok && profileJson.profile) {
      setProfile({
        ...DEFAULT_PROFILE,
        ...profileJson.profile,
        portfolio_links: profileJson.profile.portfolio_links?.length ? profileJson.profile.portfolio_links : [""],
        portfolio_images: profileJson.profile.portfolio_images?.length ? profileJson.profile.portfolio_images : [""],
        tags: profileJson.profile.tags?.length ? profileJson.profile.tags : [""],
        worked_event_ids: profileJson.profile.worked_event_ids || [],
      });
    }
    setAvailableEvents(profileJson.availableEvents || []);
    if (requestsRes.ok) setRequests(requestsJson.requests || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/evntszn/crew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.display_name,
        slug: profile.slug,
        category: profile.category,
        customCategory: profile.custom_category,
        headline: profile.headline,
        shortBio: profile.short_bio,
        city: profile.city,
        state: profile.state,
        rateAmountCents: profile.rate_amount_cents,
        rateUnit: profile.rate_unit,
        availabilityState: profile.availability_state,
        acceptsBookingRequests: profile.accepts_booking_requests,
        bookingFeeCents: profile.booking_fee_cents,
        portfolioLinks: (profile.portfolio_links || []).filter(Boolean),
        portfolioImages: (profile.portfolio_images || []).filter(Boolean),
        tags: (profile.tags || []).filter(Boolean),
        instagramUrl: profile.instagram_url,
        websiteUrl: profile.website_url,
        contactEmail: profile.contact_email,
        status: profile.status,
        workedEventIds: profile.worked_event_ids || [],
      }),
    });
    const json = (await res.json()) as { profile?: CrewProfile; error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not save crew profile.");
    } else {
      setProfile({
        ...DEFAULT_PROFILE,
        ...json.profile,
        portfolio_links: json.profile?.portfolio_links?.length ? json.profile.portfolio_links : [""],
        portfolio_images: json.profile?.portfolio_images?.length ? json.profile.portfolio_images : [""],
        tags: json.profile?.tags?.length ? json.profile.tags : [""],
        worked_event_ids: json.profile?.worked_event_ids || [],
      });
      setMessage("Crew profile saved.");
    }
    setSaving(false);
  }

  async function updateRequestStatus(requestId: string, status: string) {
    const res = await fetch(`/api/evntszn/crew/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not update request.");
      return;
    }
    await load();
  }

  function updateArrayField(field: "portfolio_links" | "portfolio_images" | "tags", index: number, value: string) {
    const next = [...(profile[field] || [""])];
    next[index] = value;
    setProfile({ ...profile, [field]: next });
  }

  function addArrayField(field: "portfolio_links" | "portfolio_images" | "tags") {
    setProfile({ ...profile, [field]: [...(profile[field] || [""]), ""] });
  }

  return (
    <div className="space-y-8">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">EVNTSZN Crew</div>
            <h1 className="ev-title">Publish your marketplace profile and work real booking requests.</h1>
            <p className="ev-subtitle">
              This desk controls your public listing, availability, rate positioning, portfolio links, and booking inbox.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Public profile</div>
              <div className="ev-meta-value text-base">{profile.slug ? `/crew/${profile.slug}` : "Create slug on save"}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Open requests</div>
              <div className="ev-meta-value">{requests.filter((request) => ["requested", "reviewing"].includes(request.status)).length}</div>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">{message}</div> : null}

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="ev-panel p-7 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="ev-field" placeholder="Display name" value={profile.display_name || ""} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} />
            <input className="ev-field" placeholder="Public slug" value={profile.slug || ""} onChange={(event) => setProfile({ ...profile, slug: event.target.value })} />
            <select className="ev-field" value={profile.category || "host"} onChange={(event) => setProfile({ ...profile, category: event.target.value })}>
              {CREW_CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {getCrewCategoryLabel(entry)}
                </option>
              ))}
            </select>
            <input className="ev-field" placeholder="Custom category" value={profile.custom_category || ""} onChange={(event) => setProfile({ ...profile, custom_category: event.target.value })} />
            <input className="ev-field md:col-span-2" placeholder="Headline" value={profile.headline || ""} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} />
            <textarea className="ev-textarea md:col-span-2" rows={5} placeholder="Short description" value={profile.short_bio || ""} onChange={(event) => setProfile({ ...profile, short_bio: event.target.value })} />
            <input className="ev-field" placeholder="City" value={profile.city || ""} onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
            <input className="ev-field" placeholder="State" value={profile.state || ""} onChange={(event) => setProfile({ ...profile, state: event.target.value })} />
            <input className="ev-field" type="number" placeholder="Rate cents" value={profile.rate_amount_cents || ""} onChange={(event) => setProfile({ ...profile, rate_amount_cents: event.target.value ? Number(event.target.value) : null })} />
            <input className="ev-field" placeholder="Rate unit" value={profile.rate_unit || ""} onChange={(event) => setProfile({ ...profile, rate_unit: event.target.value })} />
            <select className="ev-field" value={profile.availability_state || "available"} onChange={(event) => setProfile({ ...profile, availability_state: event.target.value })}>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select className="ev-field" value={profile.status || "draft"} onChange={(event) => setProfile({ ...profile, status: event.target.value as "draft" | "published" })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <input className="ev-field" type="number" placeholder="Booking fee cents" value={profile.booking_fee_cents || ""} onChange={(event) => setProfile({ ...profile, booking_fee_cents: event.target.value ? Number(event.target.value) : null })} />
            <input className="ev-field" placeholder="Contact email" value={profile.contact_email || ""} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} />
            <input className="ev-field" placeholder="Instagram URL" value={profile.instagram_url || ""} onChange={(event) => setProfile({ ...profile, instagram_url: event.target.value })} />
            <input className="ev-field" placeholder="Website URL" value={profile.website_url || ""} onChange={(event) => setProfile({ ...profile, website_url: event.target.value })} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <label className="rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white/80">
              <input type="checkbox" checked={profile.accepts_booking_requests !== false} onChange={(event) => setProfile({ ...profile, accepts_booking_requests: event.target.checked })} className="mr-2 accent-[#A259FF]" />
              Accept booking requests
            </label>
          </div>

          <div className="mt-8 grid gap-5">
            {[
              ["portfolio_links", "Portfolio links"],
              ["portfolio_images", "Portfolio image URLs"],
              ["tags", "Tags"],
            ].map(([field, label]) => (
              <div key={field} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">{label}</div>
                  <button type="button" onClick={() => addArrayField(field as any)} className="ev-button-secondary">
                    Add
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  {(profile[field as keyof CrewProfile] as string[]).map((value, index) => (
                    <input key={`${field}-${index}`} className="ev-field" value={value} onChange={(event) => updateArrayField(field as any, index, event.target.value)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-white">Worked events</div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Show where you&apos;ve worked</div>
            </div>
            <div className="mt-4 grid gap-3">
              {availableEvents.map((event) => {
                const checked = (profile.worked_event_ids || []).includes(event.id);
                return (
                  <label key={event.id} className={`flex items-start gap-3 rounded-[22px] border p-4 transition ${checked ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/10 bg-black/20"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setProfile({
                          ...profile,
                          worked_event_ids: checked
                            ? (profile.worked_event_ids || []).filter((id) => id !== event.id)
                            : [...(profile.worked_event_ids || []), event.id],
                        })
                      }
                      className="mt-1 h-4 w-4 accent-[#A259FF]"
                    />
                    <span>
                      <div className="text-sm font-bold text-white">{event.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {[event.city, event.state].filter(Boolean).join(", ")} • {new Date(event.start_at).toLocaleDateString()}
                      </div>
                    </span>
                  </label>
                );
              })}
              {!availableEvents.length ? (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                  No published events are available to credit yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={saveProfile} disabled={saving} className="ev-button-primary">
              {saving ? "Saving..." : "Save crew profile"}
            </button>
            {profile.slug ? <a href={`/${profile.slug}`} target="_blank" rel="noreferrer" className="ev-button-secondary">Open public profile</a> : null}
          </div>
        </section>

        <section className="ev-panel p-7 md:p-8">
          <div className="ev-section-kicker">Booking inbox</div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Review incoming requests.</h2>
          <div className="mt-6 grid gap-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-white">{request.requested_by_name}</div>
                    <div className="mt-1 text-sm text-white/55">{request.requested_by_email}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {request.status}
                  </div>
                </div>
                <div className="mt-4 text-sm leading-6 text-white/68">
                  {[request.requested_role, request.event_name, [request.city, request.state].filter(Boolean).join(", ") || null].filter(Boolean).join(" • ")}
                </div>
                {request.message ? <p className="mt-3 text-sm leading-6 text-white/72">{request.message}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {["reviewing", "accepted", "declined", "completed"].map((status) => (
                    <button key={status} type="button" onClick={() => void updateRequestStatus(request.id, status)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            {!requests.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                No booking requests yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
