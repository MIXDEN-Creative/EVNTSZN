"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicModules } from "@/lib/site-content";

type Opportunity = {
  id: string;
  title: string;
  department: string | null;
  opportunity_type: string;
  summary: string | null;
  description: string | null;
  requirements: string[] | null;
  perks: string[] | null;
  pay_label: string | null;
  pay_type?: string | null;
  pay_amount?: number | null;
  employment_status?: string | null;
  location_city: string | null;
  location_state: string | null;
  season_name?: string | null;
  event_title?: string | null;
  position_status?: string | null;
  slots_needed?: number;
  slots_filled?: number;
};

export default function OpportunitiesClient({ modules }: { modules: PublicModules }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    preferredRoles: "",
    experienceSummary: "",
    availabilitySummary: "",
    whyJoin: "",
    resumeUrl: "",
    portfolioUrl: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const selectedOpportunity = opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) || null;

  async function load(nextQuery = query, nextCity = city) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (nextCity) params.set("city", nextCity);
    const res = await fetch(`/api/epl/opportunities?${params.toString()}`, { cache: "no-store" });
    const json = (await res.json()) as { opportunities?: Opportunity[] };
    setOpportunities(json.opportunities || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedOpportunityId && opportunities.length > 0) {
      setSelectedOpportunityId(opportunities[0].id);
      setForm((prev) => ({
        ...prev,
        preferredRoles: opportunities[0].title,
      }));
    }
  }, [opportunities, selectedOpportunityId]);

  const grouped = useMemo(() => {
    return opportunities.reduce<Record<string, Opportunity[]>>((acc, opp) => {
      const key = opp.opportunity_type || "openings";
      if (!acc[key]) acc[key] = [];
      acc[key].push(opp);
      return acc;
    }, {});
  }, [opportunities]);

  async function submitApplication() {
    setMessage("");
    const payload = new FormData();
    payload.set("seasonSlug", "season-1");
    if (selectedOpportunityId) payload.set("opportunityId", selectedOpportunityId);
    payload.set("firstName", form.firstName);
    payload.set("lastName", form.lastName);
    payload.set("email", form.email);
    payload.set("phone", form.phone);
    payload.set("city", form.city);
    payload.set("state", form.state);
    payload.set("preferredRoles", JSON.stringify(form.preferredRoles.split(",").map((item) => item.trim()).filter(Boolean)));
    payload.set("experienceSummary", form.experienceSummary);
    payload.set("availabilitySummary", form.availabilitySummary);
    payload.set("whyJoin", form.whyJoin);
    payload.set("resumeUrl", form.resumeUrl);
    payload.set("portfolioUrl", form.portfolioUrl);
    if (resumeFile) payload.set("resumeFile", resumeFile);

    const res = await fetch("/api/epl/opportunities", {
      method: "POST",
      body: payload,
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(json.error || "Could not submit application.");
      return;
    }
    setMessage("Application submitted. The EPL staffing team can now review your role-specific application.");
    setResumeFile(null);
  }

  function selectOpportunity(opportunity: Opportunity) {
    setSelectedOpportunityId(opportunity.id);
    setForm((prev) => ({
      ...prev,
      preferredRoles: opportunity.title,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">{modules.opportunitiesBlock.eyebrow}</div>
            <h1 className="ev-title">{modules.opportunitiesBlock.headline}</h1>
            <p className="ev-subtitle">
              {modules.opportunitiesBlock.body}
            </p>
          </div>
        </div>
      </section>

      <section className="ev-panel mt-8 p-7 md:p-8">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="ev-field" placeholder="Search check-in, content, sideline, support..." />
          <input value={city} onChange={(e) => setCity(e.target.value)} className="ev-field" placeholder="City" />
          <button type="button" onClick={() => load(query, city)} className="ev-button-primary">Search</button>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
        <section id="roles" className="space-y-8">
          {!opportunities.length ? (
            <section className="ev-panel p-6">
              <div className="ev-section-kicker">No open roles</div>
              <h2 className="mt-3 text-2xl font-black text-white">No public EPL staffing roles are live right now.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                Check back for the next wave of volunteer and paid openings, or use support if you want to raise your hand for future league nights.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/support" className="ev-button-primary">Contact support</a>
                <a href="/epl" className="ev-button-secondary">Back to EPL</a>
              </div>
            </section>
          ) : null}

          {Object.entries(grouped).map(([group, items]) => (
            <section key={group}>
              <div className="flex items-center justify-between gap-3">
                <div className="ev-kicker">{group === "paid" ? "Paid roles" : "Volunteer roles"}</div>
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">{items.length} open now</div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {items.map((opp) => (
                  <article
                    key={opp.id}
                    className={`ev-panel p-5 transition ${selectedOpportunityId === opp.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em]">
                          <span className="text-[#caa7ff]">{opp.department || "EPL"}</span>
                          <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{opp.opportunity_type === "paid" ? "Paid" : "Volunteer"}</span>
                          {opp.position_status === "nearly_filled" ? <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">Almost filled</span> : null}
                        </div>
                        <h2 className="mt-2 text-2xl font-bold text-white">{opp.title}</h2>
                      </div>
                      <button type="button" onClick={() => selectOpportunity(opp)} className="ev-button-secondary text-sm">
                        View role
                      </button>
                    </div>
                    <p className="mt-4 text-white/70">{opp.summary || opp.description}</p>
                    <div className="mt-3 text-sm text-white/52">
                      {[opp.location_city ? `${opp.location_city}${opp.location_state ? `, ${opp.location_state}` : ""}` : "Baltimore", opp.event_title || opp.season_name || null].filter(Boolean).join(" • ")}
                    </div>
                    {opp.opportunity_type === "paid" ? (
                      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                        {[opp.pay_label, opp.employment_status?.replace(/_/g, " ")].filter(Boolean).join(" • ") || "Paid role"}
                      </div>
                    ) : null}
                    {opp.opportunity_type === "volunteer" && opp.perks?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {opp.perks.slice(0, 4).map((perk) => (
                          <span key={perk} className="ev-chip ev-chip--external">{perk}</span>
                        ))}
                      </div>
                    ) : null}
                    {opp.requirements?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {opp.requirements.slice(0, 4).map((requirement) => (
                          <span key={requirement} className="ev-chip ev-chip--external">{requirement}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section id="application" className="ev-panel p-7 md:p-8 lg:sticky lg:top-24">
          <div className="ev-section-kicker">Apply</div>
          <h2 className="mt-3 text-2xl font-bold text-white">
            {selectedOpportunity ? `Apply for ${selectedOpportunity.title}` : "Choose a role to apply"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/72">
            {selectedOpportunity
              ? [
                  selectedOpportunity.opportunity_type === "paid" ? "Paid role" : "Volunteer role",
                  selectedOpportunity.location_city ? `${selectedOpportunity.location_city}${selectedOpportunity.location_state ? `, ${selectedOpportunity.location_state}` : ""}` : "Baltimore",
                  selectedOpportunity.event_title || selectedOpportunity.season_name || null,
                  selectedOpportunity.pay_label || null,
                ].filter(Boolean).join(" • ")
              : "Start by choosing an open role. EPL applications stay tied to real league-night positions instead of dropping into a generic form queue."}
          </p>
          {selectedOpportunity?.perks?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedOpportunity.perks.slice(0, 5).map((perk) => (
                <span key={perk} className="ev-chip ev-chip--external">
                  {perk}
                </span>
              ))}
            </div>
          ) : null}
          {selectedOpportunity ? (
            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <input className="ev-field" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <input className="ev-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="ev-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="ev-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input className="ev-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <input className="ev-field" placeholder="Preferred role" value={form.preferredRoles} onChange={(e) => setForm({ ...form, preferredRoles: e.target.value })} />
              <div className="grid gap-3">
                <input className="ev-field" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                <div className="text-xs leading-6 text-white/52">
                  Upload a resume file directly if you have one ready. If not, use the URL field below.
                </div>
              </div>
              <input className="ev-field" placeholder="Resume URL (fallback)" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
              <input className="ev-field" placeholder="Portfolio or LinkedIn URL" value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} />
              <textarea className="ev-textarea" rows={4} placeholder="Relevant experience" value={form.experienceSummary} onChange={(e) => setForm({ ...form, experienceSummary: e.target.value })} />
              <textarea className="ev-textarea" rows={3} placeholder="Availability" value={form.availabilitySummary} onChange={(e) => setForm({ ...form, availabilitySummary: e.target.value })} />
              <textarea className="ev-textarea" rows={4} placeholder="Why do you want the role?" value={form.whyJoin} onChange={(e) => setForm({ ...form, whyJoin: e.target.value })} />
              <div className="text-sm text-white/55">
                Selected role: {selectedOpportunity.title}
              </div>
              <button type="button" onClick={submitApplication} disabled={!selectedOpportunityId} className="ev-button-primary disabled:cursor-not-allowed disabled:opacity-50">Submit application</button>
              {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-white/58">
              Browse the paid and volunteer roles first, then open the one that fits you. The application form stays secondary until you pick a real opening.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
