import { either, task, taskEither } from "fp-ts";
import { pipe } from "fp-ts/function";
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
    api: t.keyof({ "get-payment-details": null, "get-authorization": null }),
    entityID: t.string,
  }),
  t.type({
    api: t.literal("get-list-of-payments"),
  }),
  t.type({
    api: t.keyof({ "update-payment": null, "update-authorization": null }),
    entityID: t.string,
    body: t.record(t.string, t.unknown),
  }),
  t.type({
    api: t.literal("retrieve-daily-closure"),
    dailyClosureDate: t.string,
    generatePdf: t.boolean,
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
    taskEither.fromPredicate(InvokeBody.is, () => new Error("Invalid body")),
    taskEither.bindTo("body"),
    taskEither.bind("auth", () =>
      pipe(
        getAuth,
        taskEither.fromIO,
        taskEither.filterOrElse(
          isAuthenticated,
          () => new Error("Unauthenticated")
        )
      )
    ),
    taskEither.let("httpClient", ({ auth }) =>
      pipe(
        httpClient,
        makeLoggedClient,
        makeSignedHttpClient({
          keyID: auth.keyID,
          privateKey: auth.keyPair.privateKey,
        })
      )
    ),
    taskEither.bind("response", ({ body, auth, httpClient }) => {
      const base = ENDPOINTS[auth.endpoint];
      const path = match(body)
        .with(
          { api: "create-authorization" },
          () => "/g_business/v1/pre_authorized_payment_tokens"
        )
        .with(
          { api: "get-authorization" },
          { api: "update-authorization" },
          ({ entityID }) =>
            `/g_business/v1/pre_authorized_payment_tokens/${entityID}`
        )
        .with(
          { api: "create-payment" },
          { api: "get-list-of-payments" },
          () => "/g_business/v1/payments"
        )
        .with(
          { api: "get-payment-details" },
          { api: "update-payment" },
          ({ entityID }) => `/g_business/v1/payments/${entityID}`
        )
        .with(
          { api: "retrieve-daily-closure" },
          ({ dailyClosureDate, generatePdf }) => {
            const searchParams = new URLSearchParams();
            if (generatePdf) searchParams.append("generate_pdf", "true");
            return (
              `/g_business/v1/daily_closure/${dailyClosureDate}?` +
              searchParams.toString()
            );
          }
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
        .with(
          { api: "get-list-of-payments" },
          { api: "retrieve-daily-closure" },
          { api: "get-authorization" },
          () => httpClient.request(url)
        )
        .with(
          { api: "update-payment" },
          { api: "update-authorization" },
          ({ body }) =>
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
    taskEither.bind("responseBody", ({ response }) =>
      taskEither.tryCatch(() => response.text(), either.toError)
    ),
    taskEither.chainIOK(
      ({ response, responseBody }) =>
        () =>
          res.status(200).json({
            status: response.status,
            body: responseBody,
            headers: collectHeaders(response.headers),
          })
    ),
    taskEither.orElseFirstIOK((e) => () => console.error(e)),
    taskEither.getOrElseW(() => task.fromIO(() => res.status(500).end())),
    (effect) => effect()
  );
}
