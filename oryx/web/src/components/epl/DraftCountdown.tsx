"use client";

import { useEffect, useMemo, useState } from "react";

function getTimeRemaining(targetDate: string) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const distance = target - now;

  if (distance <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export default function DraftCountdown() {
  const targetDate = useMemo(() => "2026-06-06T19:00:00-04:00", []);
  const [time, setTime] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <section
      id="countdown"
      className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#120f2a] via-[#0c0c15] to-black p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] md:p-8"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
        Draft Countdown
      </div>

      <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
        The road to Draft Night is already ticking.
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
        Season 1 gets real on Saturday, June 20. Registration, roster movement, team identity, and league momentum all point here.
      </p>

      {time.expired ? (
        <div className="mt-6 rounded-2xl border border-[#A259FF]/30 bg-[#A259FF]/10 px-5 py-4 text-lg font-bold text-white">
          Draft Night is live.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Days", value: time.days },
            { label: "Hours", value: time.hours },
            { label: "Minutes", value: time.minutes },
            { label: "Seconds", value: time.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl"
            >
              <div className="text-3xl font-black text-white md:text-5xl">{item.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
