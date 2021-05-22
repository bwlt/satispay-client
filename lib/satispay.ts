import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { withLog, fetchHttpClient, Headers } from "./httpClient";

const fetch = withLog(fetchHttpClient);

export const Env = t.keyof({
  production: null,
  sandbox: null,
});

export type Env = t.TypeOf<typeof Env>;

export function getEndpoint(env: Env): string {
  switch (env) {
    case "production":
      return "https://authservices.satispay.com";
    case "sandbox":
      return "https://staging.authservices.satispay.com";
  }
}

function makeUrl(env: Env, path: string): URL {
  return new URL(path, getEndpoint(env));
}

const PostAuthenticationKeysResult = t.type({
  key_id: t.string,
});
type PostAuthenticationKeysResult = t.TypeOf<
  typeof PostAuthenticationKeysResult
>;

export function postAuthenticationKeys(
  env: Env,
  body: { public_key: string; token: string }
): TE.TaskEither<Error, PostAuthenticationKeysResult> {
  const url = makeUrl(env, "/g_business/v1/authentication_keys").toString();
  return pipe(
    fetch(url, {
      body: JSON.stringify(body),
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    }),
    TE.filterOrElse(
      (a) => a.ok,
      (a) => new Error(`Unexpected response status ${a.status}`)
    ),
    TE.chainEitherK((a) => a.json()),
    TE.filterOrElse(
      PostAuthenticationKeysResult.is,
      () => new Error("Unexpected response body")
    )
  );
}
