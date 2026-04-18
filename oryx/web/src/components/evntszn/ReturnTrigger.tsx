"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";

export default function ReturnTrigger({
  href = "/map",
  tone = "default",
}: {
  href?: string;
  tone?: "default" | "reserve";
}) {
  const { items } = useSavedItems();
  const watchCount = items.filter((item) => item.intent === "watch").length;
  const planCount = items.filter((item) => item.intent === "plan").length;

  const copy = useMemo(() => {
    if (planCount > 0) return "Your night has active picks. Check back tonight before the room shifts.";
    if (watchCount > 0) return "Something is building in the places you’re watching.";
    if (tone === "reserve") return "Demand moves fast tonight. Check back after 10 if your first pick closes.";
    return "Check back tonight. Momentum usually sharpens as the city fills in.";
  }, [planCount, tone, watchCount]);

  return (
    <div className={`rounded-2xl border p-4 text-sm ${
      tone === "reserve"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-50"
        : "border-white/10 bg-white/[0.04] text-white/72"
    }`}>
      <div>{copy}</div>
      <Link href={href} className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4">
        {planCount > 0 ? "Open Your Night" : "Check what&apos;s building"}
      </Link>
    </div>
  );
}
