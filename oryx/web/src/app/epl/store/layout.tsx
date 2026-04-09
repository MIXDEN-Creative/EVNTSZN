import type { Metadata } from "next";
import { getEplOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EPL Store | EVNTSZN",
  description: "Shop official EVNTSZN Prime League gear, featured drops, and real league merch built around coed flag football.",
  alternates: {
    canonical: `${getEplOrigin()}/store`,
  },
  openGraph: {
    title: "EPL Store | EVNTSZN",
    description: "Shop official EVNTSZN Prime League gear, featured drops, and real league merch built around coed flag football.",
    url: `${getEplOrigin()}/store`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPL Store | EVNTSZN",
    description: "Shop official EVNTSZN Prime League gear, featured drops, and real league merch built around coed flag football.",
  },
};

export default function EplStoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
