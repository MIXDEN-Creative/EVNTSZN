export function hasPermission(operator: any, fn: string) {
  return operator?.functions?.includes(fn);
}

export function isFounder(operator: any) {
  return operator?.role_key === "founder";
}
