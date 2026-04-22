type OperatorLike = {
  role_key?: string | null;
  functions?: string[] | null;
} | null | undefined;

export function hasPermission(operator: OperatorLike, fn: string) {
  return operator?.functions?.includes(fn);
}

export function isFounder(operator: OperatorLike) {
  return operator?.role_key === "founder";
}
