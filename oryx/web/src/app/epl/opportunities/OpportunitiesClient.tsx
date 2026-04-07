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
  location_city: string | null;
  location_state: string | null;
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
    setMessage("Application submitted. The EPL hiring team can now review and route you through interviews from the dashboard.");
    setResumeFile(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
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

      <section className="ev-panel mt-6 p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="ev-field" placeholder="Search operations, growth, partnerships, staffing..." />
          <input value={city} onChange={(e) => setCity(e.target.value)} className="ev-field" placeholder="City" />
          <button type="button" onClick={() => load(query, city)} className="ev-button-primary">Search</button>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          {Object.entries(grouped).map(([group, items]) => (
            <section key={group}>
              <div className="ev-kicker">{group}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {items.map((opp) => (
                  <article key={opp.id} className="ev-panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">{opp.department || "EPL"}</div>
                        <h2 className="mt-2 text-2xl font-bold text-white">{opp.title}</h2>
                      </div>
                      <button type="button" onClick={() => setSelectedOpportunityId(opp.id)} className="ev-button-secondary text-sm">
                        Apply
                      </button>
                    </div>
                    <p className="mt-3 text-white/70">{opp.summary || opp.description}</p>
                    <div className="mt-3 text-sm text-white/52">
                      {opp.location_city || "Baltimore"}{opp.location_state ? `, ${opp.location_state}` : ""} {opp.pay_label ? `• ${opp.pay_label}` : ""}
                    </div>
                    {opp.requirements?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {opp.requirements.map((requirement) => (
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

        <section id="application" className="ev-panel p-6">
          <div className="ev-section-kicker">Application</div>
          <h2 className="mt-3 text-2xl font-bold text-white">Start your EPL application.</h2>
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
            <input className="ev-field" placeholder="Preferred roles (comma separated)" value={form.preferredRoles} onChange={(e) => setForm({ ...form, preferredRoles: e.target.value })} />
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
              {selectedOpportunityId ? `Selected opportunity: ${selectedOpportunityId}` : "You can apply generally or choose a specific role."}
            </div>
            <button type="button" onClick={submitApplication} className="ev-button-primary">Submit application</button>
            {message ? <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">{message}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
