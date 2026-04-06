"use client";

import { useEffect, useState } from "react";

export default function DraftControls({ seasonSlug }: { seasonSlug: string }) {
  const [autoIntervalSeconds, setAutoIntervalSeconds] = useState<number>(8);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // ONLY set default once from backend
  useEffect(() => {
    if (initialized) return;

    async function loadSettings() {
      try {
        const res = await fetch(`/api/epl/draft/state?seasonSlug=${seasonSlug}`);
        const data = await res.json();

        if (data?.session?.auto_interval_seconds) {
          setAutoIntervalSeconds(data.session.auto_interval_seconds);
        }
      } catch (err) {
        console.error("Failed to load draft settings", err);
      } finally {
        setInitialized(true);
      }
    }

    loadSettings();
  }, [seasonSlug, initialized]);

  async function generateDraft() {
    setLoading(true);

    try {
      const res = await fetch(`/api/epl/draft/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seasonSlug,
          title: "Season 1 Draft Night",
          snakeMode: true,
          autoIntervalSeconds,
        }),
      });

      const json = await res.json();

      if (json.error) {
        alert(json.error);
      } else {
        alert("Draft generated");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating draft");
    } finally {
      setLoading(false);
    }
  }

  const speeds = [6, 8, 10, 12, 15];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60 mb-2">Auto Draft Speed</p>
        <div className="flex gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setAutoIntervalSeconds(s)}
              className={`px-4 py-2 rounded-xl border ${
                autoIntervalSeconds === s
                  ? "bg-[#A259FF] text-white border-[#A259FF]"
                  : "border-white/20 text-white/70"
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generateDraft}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-white text-black font-semibold"
      >
        {loading ? "Generating..." : "Generate Draft"}
      </button>
    </div>
  );
}
