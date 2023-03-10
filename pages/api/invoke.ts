import { either as E, task as T, taskEither as TE } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import type { NextApiRequest, NextApiResponse } from "next";
import { match } from "ts-pattern";
import {
  collectHeaders,
  httpClient,
  makeLoggedClient,
  makeSignedHttpClient,
} from "../../modules/http";
import { ENDPOINTS } from "../../modules/satispay";
import { getAuth, isAuthenticated } from "../../modules/session";

export const InvokeBody = t.union([
  t.type({
    api: t.keyof({ "create-payment": null, "create-authorization": null }),
    body: t.record(t.string, t.unknown),
  }),
  t.type({
    api: t.literal("get-payment-details"),
    entityID: t.string,
  }),
  t.type({
    api: t.literal("update-payment"),
    entityID: t.string,
    body: t.record(t.string, t.unknown),
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
    TE.bind("response", ({ body, auth, httpClient }) => {
      const base = ENDPOINTS[auth.endpoint];
      const makeUrl = (path: string) => new URL(path, base);
      const path = match(body)
        .with(
          { api: "create-authorization" },
          () => "/g_business/v1/pre_authorized_payment_tokens"
        )
        .with({ api: "create-payment" }, () => "/g_business/v1/payments")
        .with(
          { api: "get-payment-details" },
          { api: "update-payment" },
          ({ entityID }) => `/g_business/v1/payments/${entityID}`
        )
        .exhaustive();
      const url = new URL(path, base);
      return match(body)
        .with(
          { api: "create-payment" },
          { api: "create-authorization" },
          ({ body }) =>
            httpClient.request(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(body),
            })
        )
        .with({ api: "get-payment-details" }, () =>
          httpClient.request(url, {
            headers: {
              Accept: "application/json",
            },
          })
        )
        .with({ api: "update-payment" }, ({ body }) =>
          httpClient.request(url, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            method: "PUT",
            body: JSON.stringify(body),
          })
        )
        .exhaustive();
    }),
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
