import type { Metadata } from "next";
import OpportunitiesClient from "./OpportunitiesClient";
import { getEplOrigin } from "@/lib/domains";
import { getEplPublicContent, getPublicModulesContent } from "@/lib/site-content";
import EplNav from "@/components/epl/EplNav";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = {
  title: "EPL Opportunities | EVNTSZN",
  description: "Apply for active EPL volunteer and paid opportunities across league operations, partnerships, audience growth, and game-day execution.",
  alternates: {
    canonical: `${getEplOrigin()}/opportunities`,
  },
  openGraph: {
    title: "EPL Opportunities | EVNTSZN",
    description: "Apply for active EPL volunteer and paid opportunities across league operations, partnerships, audience growth, and game-day execution.",
    url: `${getEplOrigin()}/opportunities`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPL Opportunities | EVNTSZN",
    description: "Apply for active EPL volunteer and paid opportunities across league operations, partnerships, audience growth, and game-day execution.",
  },
};

export default async function EplOpportunitiesPage() {
  const [modules, content] = await Promise.all([getPublicModulesContent(), getEplPublicContent()]);

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <OpportunitiesClient modules={modules} />
      <PublicFooter />
    </main>
  );
}
