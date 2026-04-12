"use client";

import { useEffect, useState } from "react";

export default function LinkPageLiveMeta({
  slug,
  initialViewCount,
}: {
  slug: string;
  initialViewCount: number;
}) {
  const [viewCount, setViewCount] = useState(initialViewCount);

  useEffect(() => {
    const storageKey = `evntszn-link-viewed:${slug}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(storageKey)) return;

    window.sessionStorage.setItem(storageKey, "1");
    void fetch(`/api/evntszn/link/${slug}/view`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { viewCount?: number };
      })
      .then((payload) => {
        if (payload?.viewCount) {
          setViewCount(payload.viewCount);
        }
      })
      .catch(() => null);
  }, [slug]);

  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
      {viewCount.toLocaleString()} people viewed this
    </div>
  );
}
