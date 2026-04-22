import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

type UserLike = { id?: string | null } | null | undefined;
type OperatorLike = { role_key?: string | null; functions?: string[] | null } | null | undefined;

export function requireAuth(user: UserLike) {
  if (!user) redirect("/");
}

export function requireOperator(operator: OperatorLike) {
  if (!operator) redirect("/");
}

export function requireFunction(operator: OperatorLike, fn: string) {
  if (!hasPermission(operator, fn)) {
    throw new Error("Missing permission: " + fn);
  }
}
