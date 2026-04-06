export default function SetupTab({
  seasonSlug,
  title,
  speed,
  setSeasonSlug,
  setTitle,
  setSpeed,
  loading,
  error,
  prepareDraft,
}: any) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 text-sm text-white/55">
        Snake draft • 12 rounds • 6 teams • 72 locked picks
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_280px]">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Season Slug
          </label>
          <input
            value={seasonSlug}
            onChange={(e) => setSeasonSlug(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            placeholder="season-1"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Draft Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            placeholder="Season 1 Draft Night"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Pick Reveal Time
          </label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          >
            <option value={6}>6 sec</option>
            <option value={8}>8 sec</option>
            <option value={10}>10 sec</option>
            <option value={12}>12 sec</option>
            <option value={15}>15 sec</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Draft Actions
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => prepareDraft("resume")}
              disabled={loading}
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white"
            >
              Resume Draft
            </button>
            <button
              onClick={() => prepareDraft("new")}
              disabled={loading}
              className="h-12 flex-1 rounded-2xl bg-[#A259FF] px-5 text-sm font-semibold text-white"
            >
              {loading ? "Preparing..." : "Create New Draft"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
