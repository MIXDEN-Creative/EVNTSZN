import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/domains";
import AdminPasswordRecoveryClient from "./AdminPasswordRecoveryClient";

export const metadata: Metadata = {
  title: "Internal Password Recovery | EVNTSZN",
  description: "Reset internal EVNTSZN access for HQ, admin, office, ops, scanner, and host users.",
  alternates: {
    canonical: `${getAppOrigin()}/admin-login/recover`,
  },
};

export default function AdminPasswordRecoveryPage() {
  return <AdminPasswordRecoveryClient />;
}
