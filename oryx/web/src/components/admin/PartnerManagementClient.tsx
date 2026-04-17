"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type PartnerRecord = {
  id: string;
  name?: string | null;
  logo_url?: string | null;
  logo_path?: string | null;
  website_url?: string | null;
  tier?: string | null;
};

export default function PartnerManagementClient() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [tier, setTier] = useState("Partner");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  async function fetchPartners() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/partners", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load partners");
      }

      const payload = (await res.json()) as any;
      const safePayload = payload as any;

      const rows = Array.isArray(safePayload)
        ? safePayload
        : Array.isArray(safePayload?.partners)
          ? safePayload.partners
          : [];

      setPartners(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPartners();
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
  }

  async function uploadLogo() {
    if (!logoFile) return { logo_url: null, logo_path: null };

    const formData = new FormData();
    formData.append("file", logoFile);

    const res = await fetch("/api/admin/partners/upload-logo", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as any;
      const safePayload = payload as any;
      throw new Error(safePayload?.error || "Logo upload failed");
    }

    const payload = (await res.json()) as any;
    return {
      logo_url: payload.publicUrl,
      logo_path: payload.path,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const uploaded = await uploadLogo();

      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          tier,
          website_url: websiteUrl || null,
          logo_url: uploaded.logo_url,
          logo_path: uploaded.logo_path,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as any;
        throw new Error(payload?.error || "Failed to save partner");
      }

      setName("");
      setTier("Partner");
      setWebsiteUrl("");
      setLogoFile(null);

      await fetchPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save partner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Partner Management</h1>
          <p className="mt-1 text-sm text-white/60">
            Create and manage partner profiles, logos, and links.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPartners}
          className="rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-2"
      >
        <div className="space-y-2">
          <label className="text-sm text-white/70">Partner name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
            placeholder="Partner name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
          >
            <option value="Partner">Partner</option>
            <option value="Partner Pro">Partner Pro</option>
            <option value="Partner Elite">Partner Elite</option>
            <option value="Partner Premier">Partner Premier</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Website link</label>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Partner logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#A259FF] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#A259FF] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create partner"}
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
            Loading partners...
          </div>
        ) : partners.length ? (
          partners.map((partner) => (
            <article
              key={partner.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-white"
            >
              <div>
                <h2 className="text-lg font-semibold">{partner.name ?? "Untitled Partner"}</h2>
                <p className="mt-1 text-sm text-white/60">{partner.tier ?? "Partner"}</p>
              </div>

              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.name ? `${partner.name} logo` : "Partner logo"}
                  className="mt-4 h-16 w-16 rounded-2xl border border-white/10 object-cover"
                />
              ) : null}

              {partner.website_url ? (
                <a
                  href={partner.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-[#b899ff] hover:text-white"
                >
                  Visit partner site
                </a>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
            No partners found.
          </div>
        )}
      </div>
    </section>
  );
}
