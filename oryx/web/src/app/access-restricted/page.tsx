import Link from "next/link";
import { headers } from "next/headers";
import {
  type EvntsznSurface,
  type RestrictedSurface,
  getCanonicalUrl,
  getLoginUrl,
  getSurfaceFallback,
  getSurfaceLabel,
} from "@/lib/domains";

type SearchParams = Promise<{
  surface?: RestrictedSurface;
  fallbackSurface?: EvntsznSurface;
  fallbackPath?: string;
  fallbackLabel?: string;
}>;

const ALLOWED_SURFACES = new Set<RestrictedSurface>(["app", "scanner", "epl", "ops", "hq", "admin"]);
const ALLOWED_FALLBACK_SURFACES = new Set<EvntsznSurface>([
  "web",
  "app",
  "scanner",
  "epl",
  "ops",
  "hq",
  "admin",
]);

function getRestrictedCopy(surface: RestrictedSurface) {
  switch (surface) {
    case "scanner":
      return {
        eyebrow: "Scanner Access",
        title: "This lane is reserved for live event staff.",
        description:
          "The scanner surface stays tightly controlled so event check-in remains fast, accurate, and private.",
      };
    case "ops":
      return {
        eyebrow: "Operations Access",
        title: "This operations workspace is reserved for active event operators.",
        description:
          "Organizer and venue command tools only appear for approved operators on the correct EVNTSZN accounts.",
      };
    case "hq":
      return {
        eyebrow: "HQ Access",
        title: "This command surface is reserved for the highest-access EVNTSZN operators.",
        description:
          "HQ is intentionally limited to the most privileged internal accounts to protect platform operations and league control.",
      };
    case "admin":
      return {
        eyebrow: "Admin Access",
        title: "This control surface is not available to your current account.",
        description:
          "Administrative tools stay separated from attendee and operator experiences so access stays clean and deliberate.",
      };
    case "epl":
      return {
        eyebrow: "League Access",
        title: "This league control area requires an approved EPL operations account.",
        description:
          "League administration stays separated from public registration and draft viewing so the experience remains secure.",
      };
    case "app":
    default:
      return {
        eyebrow: "Member Access",
        title: "This area is not available to your current account.",
        description:
          "Sign in with the right EVNTSZN account or return to your standard member area to keep moving.",
      };
  }
}

export default async function AccessRestrictedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const host = (await headers()).get("host") || undefined;
  const surface = ALLOWED_SURFACES.has(params.surface as RestrictedSurface)
    ? (params.surface as RestrictedSurface)
    : "app";

  const defaultFallback = getSurfaceFallback(surface);
  const fallbackSurface = ALLOWED_FALLBACK_SURFACES.has(params.fallbackSurface as EvntsznSurface)
    ? (params.fallbackSurface as EvntsznSurface)
    : defaultFallback.surface;
  const fallbackPath =
    params.fallbackPath && params.fallbackPath.startsWith("/") ? params.fallbackPath : defaultFallback.path;
  const fallbackLabel = params.fallbackLabel || defaultFallback.label;
  const content = getRestrictedCopy(surface);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.18),transparent_28%),linear-gradient(180deg,#070709_0%,#030303_52%,#09090d_100%)] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <section className="w-full overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
          <div className="grid gap-8 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-10">
            <div>
              <div className="inline-flex rounded-full border border-[#A259FF]/35 bg-[#A259FF]/12 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#e1d0ff]">
                {content.eyebrow}
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                {content.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                {content.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={getCanonicalUrl(fallbackPath, fallbackSurface, host)}
                  className="inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  {fallbackLabel}
                </Link>
                <Link
                  href={getLoginUrl(fallbackPath, host)}
                  className="inline-flex items-center rounded-2xl border border-white/14 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.08]"
                >
                  Sign in with another account
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Surface status</div>
              <div className="mt-4 text-2xl font-semibold">{getSurfaceLabel(surface)}</div>
              <div className="mt-3 text-sm leading-6 text-white/58">
                Access is being held at the surface boundary to keep EVNTSZN member, scanner,
                operations, and executive environments separated.
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Recommended next move</div>
                  <div className="mt-2 text-sm text-white/74">
                    Return to your approved workspace or use a different account with the appropriate access level.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Protected by design</div>
                  <div className="mt-2 text-sm text-white/74">
                    EVNTSZN keeps privileged event operations and command surfaces intentionally separated from public and attendee flows.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
