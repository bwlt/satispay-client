import { Json, JsonRecord } from "fp-ts/lib/Json";
import { isRecord } from "./Record";

export function isJsonRecord(json: Json): json is JsonRecord {
  return isRecord(json);
}
