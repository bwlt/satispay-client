export function b64decode(s: string): string {
  return Buffer.from(s, "base64").toString("utf8");
}
export function b64encode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64");
}
