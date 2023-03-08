import { taskEither as TE, task as T, either as E } from "fp-ts";
import { hole, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import type { NextApiRequest, NextApiResponse } from "next";
import { match } from "ts-pattern";
import {
  httpClient,
  makeLoggedClient,
  makeSignedHttpClient,
} from "../../modules/http";
import { collectHeaders } from "../../modules/http";
import { ENDPOINTS } from "../../modules/satispay";
import { getAuth, isAuthenticated } from "../../modules/session";

export const InvokeBody = t.union([
  t.type({
    api: t.literal("create-payment"),
    body: t.unknown,
  }),
  t.type({
    api: t.literal("get-payment-details"),
    paymentID: t.string,
  }),
]);

export type InvokeBody = t.TypeOf<typeof InvokeBody>;

export const InvokeResult = t.type({
  status: t.number,
  headers: t.array(t.tuple([t.string, t.string])),
  body: t.string,
});

export type InvokeResult = t.TypeOf<typeof InvokeResult>;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<InvokeResult>
) {
  return pipe(
    req.body,
    TE.fromPredicate(InvokeBody.is, () => new Error("Invalid body")),
    TE.bindTo("body"),
    TE.bind("auth", () =>
      pipe(
        getAuth,
        TE.fromIO,
        TE.filterOrElse(isAuthenticated, () => new Error("Unauthenticated"))
      )
    ),
    TE.let("httpClient", ({ auth }) =>
      pipe(
        httpClient,
        makeLoggedClient,
        makeSignedHttpClient({
          keyID: auth.keyID,
          privateKey: auth.keyPair.privateKey,
        })
      )
    ),
    TE.bind("response", ({ body, auth, httpClient }) =>
      match(body)
        .with({ api: "create-payment" }, ({ body }) =>
          httpClient.request(
            new URL("/g_business/v1/payments", ENDPOINTS[auth.endpoint]),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(body),
            }
          )
        )
        .with({ api: "get-payment-details" }, ({ paymentID }) =>
          httpClient.request(
            new URL(
              `/g_business/v1/payments/${paymentID}`,
              ENDPOINTS[auth.endpoint]
            ),
            {
              headers: {
                Accept: "application/json",
              },
            }
          )
        )
        .exhaustive()
    ),
    TE.bind("responseBody", ({ response }) =>
      TE.tryCatch(() => response.text(), E.toError)
    ),
    TE.chainIOK(
      ({ response, responseBody }) =>
        () =>
          res.status(200).json({
            status: response.status,
            body: responseBody,
            headers: collectHeaders(response.headers),
          })
    ),
    TE.orElseFirstIOK((e) => () => console.error(e)),
    TE.getOrElseW(() => T.fromIO(() => res.status(500).end())),
    (effect) => effect()
  );
}
