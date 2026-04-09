import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Accept Internal Invite | EVNTSZN",
  description: "Finish invited internal access setup for EVNTSZN admin, HQ, ops, scanner, or office roles.",
  alternates: {
    canonical: `${getAppOrigin()}/admin-invite/accept`,
  },
  openGraph: {
    title: "Accept Internal Invite | EVNTSZN",
    description: "Finish invited internal access setup for EVNTSZN admin, HQ, ops, scanner, or office roles.",
    url: `${getAppOrigin()}/admin-invite/accept`,
    siteName: "EVNTSZN",
    type: "website",
  },
};

export default function AdminInviteAcceptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
