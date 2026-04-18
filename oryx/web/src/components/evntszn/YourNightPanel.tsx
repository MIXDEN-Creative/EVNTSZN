"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function YourNightPanel() {
  const { items, signedIn, loaded } = useSavedItems();

  const grouped = useMemo(() => {
    return {
      plans: items.filter((item) => item.intent === "plan").slice(0, 3),
      watches: items.filter((item) => item.intent === "watch").slice(0, 3),
      saves: items.filter((item) => item.intent === "save").slice(0, 4),
    };
  }, [items]);

  const hasItems = grouped.plans.length || grouped.watches.length || grouped.saves.length;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Your Night</div>
          <CardTitle className="mt-2 text-2xl">Your plan is taking shape.</CardTitle>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
          {signedIn ? "Account mode" : "Guest mode"}
        </div>
      </div>

      {!loaded ? (
        <CardDescription>Loading your night...</CardDescription>
      ) : hasItems ? (
        <div className="space-y-3">
          {grouped.plans.length ? (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#caa7ff]">Tonight&apos;s plan</div>
              <div className="space-y-2">
                {grouped.plans.map((item) => (
                  <Link key={`${item.intent}-${item.entityType}-${item.entityKey}`} href={item.href} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-base font-black text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-white/58">
                      {[item.city, item.state].filter(Boolean).join(", ") || "EVNTSZN"}{item.startsAt ? ` · ${new Date(item.startsAt).toLocaleString()}` : ""}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {grouped.watches.length ? (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">You&apos;re watching</div>
              <div className="flex flex-wrap gap-2">
                {grouped.watches.map((item) => (
                  <Link key={`${item.intent}-${item.entityType}-${item.entityKey}`} href={item.href} className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/72 hover:bg-white/10">
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {grouped.saves.length ? (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Saved for later tonight</div>
              <div className="space-y-2">
                {grouped.saves.map((item) => (
                  <Link key={`${item.intent}-${item.entityType}-${item.entityKey}`} href={item.href} className="block text-sm text-white/72 underline underline-offset-4">
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/12 bg-black/20 p-5 text-sm leading-6 text-white/62">
          Save a move, watch a zone, or start a reservation and EVNTSZN will begin shaping tonight around you.
        </div>
      )}
    </Card>
  );
}
