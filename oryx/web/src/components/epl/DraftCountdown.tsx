"use client";

export default function DraftCountdown() {
  return (
    <section
      id="countdown"
      className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:p-8"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
        Draft Countdown
      </div>

      <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
        The Season 1 draft structure is locked in.
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
        Season 1 is structured around two draft nights and a 144-player intake. Baltimore goes first. The coastal region follows one week later across Rehoboth, Bethany, Dewey, and Ocean City.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Draft 1", value: "Baltimore region", note: "The first live draft board for Baltimore-market player intake." },
          { label: "Draft 2", value: "Coastal region", note: "One week later for Rehoboth, Bethany, Dewey, and Ocean City." },
          { label: "Player pool", value: "144 players", note: "Season 1 intake is split cleanly across both draft events." },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              {item.label}
            </div>
            <div className="mt-3 text-2xl font-black text-white md:text-3xl">{item.value}</div>
            <div className="mt-3 text-sm leading-6 text-white/68">{item.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
