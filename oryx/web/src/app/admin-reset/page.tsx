import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/domains";
import AdminPasswordResetClient from "./AdminPasswordResetClient";

export const metadata: Metadata = {
  title: "Reset Internal Access Password | EVNTSZN",
  description: "Set a new password for invited EVNTSZN internal access after opening a recovery link.",
  alternates: {
    canonical: `${getAppOrigin()}/admin-reset`,
  },
};

export default function AdminPasswordResetPage() {
  return <AdminPasswordResetClient />;
}
