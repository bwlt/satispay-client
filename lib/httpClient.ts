import fetch, { Headers } from "node-fetch";
import * as E from "fp-ts/lib/Either";
import * as J from "fp-ts/lib/Json";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as C from "fp-ts/lib/Console";
import * as RR from "fp-ts/lib/ReadonlyRecord";
import * as RA from "fp-ts/lib/ReadonlyArray";
import * as I from "fp-ts/lib/IO";

export { Headers };

export interface RequestInit {
  body?: string;
  headers?: Headers;
  method?: "GET" | "POST";
}

export interface Response {
  ok: boolean;
  headers: Headers;
  status: number;
  text(): string;
  json(): E.Either<Error, J.Json>;
}

function collect<A>(
  f: (k: string, vals: string[]) => A
): (h: Headers) => readonly A[] {
  return (h) => pipe(h.raw(), RR.collect(f));
}

export interface HttpClient {
  (input: string, init?: RequestInit): TE.TaskEither<Error, Response>;
}

export const fetchHttpClient: HttpClient = (input, init) => {
  return pipe(
    TE.tryCatch(() => fetch(input, init), E.toError),
    TE.bindTo("response"),
    TE.bind("text", ({ response }) =>
      TE.tryCatch(() => response.text(), E.toError)
    ),
    TE.map(({ response, text }) => {
      return {
        ok: response.ok,
        headers: response.headers,
        status: response.status,
        text: () => text,
        json: () => pipe(J.parse(text), E.mapLeft(E.toError)),
      };
    })
  );
};

export function withLog(fetcher: HttpClient): HttpClient {
  return (input, init = {}) => {
    const { method = "GET", body, headers = new Headers() } = init;
    const logHeaders: (headers: Headers) => I.IO<unknown> = flow(
      collect((key, value) => `> ${key}: ${value}`),
      RA.map(C.log),
      RA.sequence(I.Applicative)
    );
    const effect = pipe(
      fetcher(input, init),
      TE.chainFirstIOK(() => C.log(`> ${method} ${input.toString()}`)),
      body ? TE.chainFirstIOK(() => C.log(`> body: ${body}`)) : identity,
      TE.chainFirstIOK(() => logHeaders(headers)),
      TE.chainFirstIOK((response) => C.log(`< status: ${response.status}`)),
      TE.chainFirstIOK((response) => C.log(`< body: ${response.text()}`)),
      TE.chainFirstIOK((response) => logHeaders(response.headers))
    );
    return effect;
  };
}
