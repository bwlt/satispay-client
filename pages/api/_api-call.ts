import * as t from "io-ts";
import { API } from "../../lib/API";

export const Body = t.type({
  api: API,
  body: t.UnknownRecord,
});

export type Body = t.TypeOf<typeof Body>;

export const Response = t.type({
  status: t.number,
  headers: t.record(t.string, t.array(t.string)),
  body: t.string,
});

export type Response = t.TypeOf<typeof Response>;
