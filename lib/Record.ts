export function isRecord(a: unknown): a is Record<string, any> {
  return a !== null && typeof a === "object" && !Array.isArray(a);
}
