import { match } from "ts-pattern";

export function format(fmt: "yyyyMMdd" | "date", date: Date): string {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  return match(fmt)
    .with("yyyyMMdd", () => `${YYYY}${MM}${DD}`)
    .with("date", () => `${YYYY}-${MM}-${DD}`)
    .exhaustive();
}

export function isValid(d: Date) {
  return !Number.isNaN(d.getTime())
}