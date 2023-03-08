import { either as E, task as T, taskEither as TE } from "fp-ts";
import { flow, pipe } from "fp-ts/function";
import type { NextApiRequest, NextApiResponse } from "next";
import { generateKeyPair } from "../../modules/crypto";
import {
  httpClient,
  makeHttpRestClient,
  makeLoggedClient,
  withBaseUrl,
} from "../../modules/http";
import { ENDPOINTS, makeSatispayClient } from "../../modules/satispay";
import { setAuthenticated } from "../../modules/session";
import * as t from "io-ts";

export const AuthenticateBody = t.type({
  env: t.keyof({ sandbox: null, production: null }),
  activationCode: t.string,
});

export type AuthenticateBody = t.TypeOf<typeof AuthenticateBody>;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return pipe(
    req.body,
    E.fromPredicate(AuthenticateBody.is, () => new Error("Invalid body")),
    E.bindTo("body"),
    E.let("endpoint", ({ body }) => body.env),
    E.let(
      "client",
      flow(
        ({ body }) => new URL(ENDPOINTS[body.env]),
        (url) => pipe(httpClient, withBaseUrl(url)),
        makeLoggedClient,
        makeHttpRestClient,
        makeSatispayClient
      )
    ),
    TE.fromEither,
    TE.bind("keyPair", () => generateKeyPair),
    TE.bind("keyID", ({ body, client, keyPair }) =>
      client.postAuthenticationKeys({
        publicKey: keyPair.publicKey,
        token: body.activationCode,
      })
    ),
    TE.chainIOK(({ endpoint, keyPair, keyID }) =>
      setAuthenticated({ endpoint, keyPair, keyID: keyID.key_id })
    ),
    TE.chainIOK(() => () => res.status(200).end()),
    TE.orElseFirstIOK((e) => () => console.error(e)),
    TE.getOrElse(() => T.fromIO(() => res.status(500).end())),
    (effect) => effect()
  );
}
