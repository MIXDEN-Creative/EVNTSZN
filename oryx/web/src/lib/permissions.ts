type OperatorLike = {
  role_key?: string | null;
  functions?: string[] | null;
} | null | undefined;

export function hasPermission(operator: OperatorLike, fn: string): boolean {
  if (!operator) return false;

  if (operator.role_key === "platform_admin") return true;

  if (operator.functions?.includes("all")) return true;

  if (Array.isArray(operator.functions)) {
    return operator.functions.includes(fn);
  }

  return false;
}
