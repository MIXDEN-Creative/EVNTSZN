import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";
import { DEFAULT_PUBLIC_MODULES, getPublicModulesContent } from "@/lib/site-content";
import { safePublicLoad } from "@/lib/public-safe-load";
import PublicFooterShell from "@/components/public/PublicFooterShell";

export default async function PublicFooter() {
  const [placements, modules] = await Promise.all([
    safePublicLoad("footer-sponsor-placements", () => getPublicSponsorPlacements("footer"), []),
    safePublicLoad("footer-public-modules", () => getPublicModulesContent(), {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    }),
  ]);

  return <PublicFooterShell placements={placements} modules={modules} />;
}
