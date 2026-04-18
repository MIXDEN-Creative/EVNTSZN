import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export function requireAuth(user: any) {
  if (!user) redirect("/");
}

export function requireOperator(operator: any) {
  if (!operator) redirect("/");
}

export function requireFunction(operator: any, fn: string) {
  if (!hasPermission(operator, fn)) {
    redirect("/");
  }
}
