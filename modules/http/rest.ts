import { either as E, json as J, taskEither as TE } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { match } from "ts-pattern";
import { HttpClient } from "./client";

export type HttpRestClient = {
  post: <A>(
    url: string,
    body: J.JsonRecord,
    codec: t.Type<A>
  ) => TaskEither<Error, t.TypeOf<t.Type<A>>>;
};

export function makeHttpRestClient(httpClient: HttpClient): HttpRestClient {
  return {
    post: (url, body, codec) =>
      pipe(
        httpClient.request(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        TE.chainFirst((response) =>
          match(response.status)
            .with(200, () => TE.right(response))
            .with(404, () => TE.left(new Error("Not found")))
            .otherwise(() => TE.left(new Error("Unexpected response status")))
        ),
        TE.chain((response) => TE.tryCatch(() => response.json(), E.toError)),
        TE.filterOrElse(codec.is, () => new Error("Parse error"))
      ),
  };
}
