"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  id: string;
  role_code: string;
  title: string;
  department: string;
  opportunity_type: string;
  summary: string;
  description: string;
  requirements: string[];
  perks: string[];
  pay_label: string | null;
  display_order: number;
};

export default function EPLJobsVolunteerPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [seasonSlug, setSeasonSlug] = useState("season-1");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [preferredRoles, setPreferredRoles] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [availabilitySummary, setAvailabilitySummary] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/epl/opportunities", { cache: "no-store" });
      const json = (await res.json()) as Record<string, any>;
      setOpportunities(json?.opportunities || []);
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, Opportunity[]> = {};
    for (const opp of opportunities) {
      if (!groups[opp.opportunity_type]) groups[opp.opportunity_type] = [];
      groups[opp.opportunity_type].push(opp);
    }
    return groups;
  }, [opportunities]);

  async function apply() {
    setMessage("");

    const res = await fetch("/api/epl/opportunities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seasonSlug,
        opportunityId: selectedOpportunityId || null,
        firstName,
        lastName,
        email,
        phone,
        city,
        state: stateValue,
        preferredRoles: preferredRoles
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        experienceSummary,
        availabilitySummary,
        whyJoin,
      }),
    });

    const json = (await res.json()) as Record<string, any>;

    if (!res.ok) {
      setMessage(json.error || "Could not submit application.");
      return;
    }

    setMessage("Application submitted.");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCity("");
    setStateValue("");
    setPreferredRoles("");
    setExperienceSummary("");
    setAvailabilitySummary("");
    setWhyJoin("");
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EPL Opportunities</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Jobs & Volunteer Opportunities</h1>
          <p className="mt-3 max-w-3xl text-white/65">
            Join EPL through paid, incentivized, and volunteer roles across leadership, operations,
            game staff, content, growth, guest experience, and revenue.
          </p>
        </div>

        {Object.entries(grouped).map(([type, items]) => (
          <section key={type} className="space-y-4">
            <h2 className="text-2xl font-semibold capitalize">{type}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((opp) => (
                <div key={opp.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">
                    {opp.department}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">{opp.title}</h3>
                  <p className="mt-3 text-white/70">{opp.summary}</p>
                  <p className="mt-3 text-sm text-white/50">{opp.description}</p>
                  <div className="mt-4 text-sm text-white/60">
                    {opp.pay_label || "See application details"}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {opp.requirements?.map((req) => (
                      <span
                        key={req}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedOpportunityId(opp.id)}
                    className="mt-5 rounded-2xl bg-[#A259FF] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Apply for this role
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">Application</p>
            <h2 className="mt-2 text-3xl font-semibold">Apply to EPL</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input value={seasonSlug} onChange={(e) => setSeasonSlug(e.target.value)} placeholder="Season slug" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={stateValue} onChange={(e) => setStateValue(e.target.value)} placeholder="State" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none" />
            <input value={preferredRoles} onChange={(e) => setPreferredRoles(e.target.value)} placeholder="Preferred roles, comma separated" className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none md:col-span-2" />
            <textarea value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)} placeholder="Experience summary" className="min-h-[120px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none md:col-span-3" />
            <textarea value={availabilitySummary} onChange={(e) => setAvailabilitySummary(e.target.value)} placeholder="Availability summary" className="min-h-[120px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none md:col-span-3" />
            <textarea value={whyJoin} onChange={(e) => setWhyJoin(e.target.value)} placeholder="Why do you want to join EPL?" className="min-h-[120px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none md:col-span-3" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button onClick={apply} className="rounded-2xl bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white">
              Submit Application
            </button>
            {selectedOpportunityId ? (
              <span className="text-sm text-white/55">Opportunity selected: {selectedOpportunityId}</span>
            ) : (
              <span className="text-sm text-white/55">You can submit without selecting a single role.</span>
            )}
            {message ? <span className="text-sm text-white/75">{message}</span> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
