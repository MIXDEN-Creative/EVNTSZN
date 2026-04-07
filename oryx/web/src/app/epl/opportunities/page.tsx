import type { Metadata } from "next";
import OpportunitiesClient from "./OpportunitiesClient";
import { getEplOrigin } from "@/lib/domains";
import { getPublicModulesContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "EPL Opportunities | EVNTSZN",
  description: "Apply for active EPL volunteer and paid opportunities across league operations, partnerships, audience growth, and game-day execution.",
  alternates: {
    canonical: `${getEplOrigin()}/opportunities`,
  },
};

export default async function EplOpportunitiesPage() {
  const modules = await getPublicModulesContent();
  return <OpportunitiesClient modules={modules} />;
}
