import { NextApiHandler } from "next";
import { getPathnameAndMethodByAPI } from "../../lib/API";
import { fetchHttpClient, withLog, Headers } from "../../lib/httpClient";
import { signedHttpClient } from "../../lib/httpSignature";
import { getEndpoint } from "../../lib/satispay";
import { getSession } from "../../lib/session";
import { pipe } from "fp-ts/lib/function";
import { fromPredicate, isNone } from "fp-ts/lib/Option";
import { Body, Response } from "./_api-call";
import * as T from "fp-ts/lib/Task";
import { unsafeExpect } from "../../lib/Either";

const handler: NextApiHandler<Response> = async (req, res) => {
  const session = await pipe(getSession(), T.map(unsafeExpect), (effect) =>
    effect()
  );
  const body = pipe(req.body, fromPredicate(Body.is));
  if (isNone(body)) {
    res.status(400);
    return;
  }
  if (session.type === "LOGGED_OUT") {
    res.status(401);
    return;
  }
  const client = withLog(signedHttpClient(session.auth)(fetchHttpClient));

  const { method, pathname } = getPathnameAndMethodByAPI(body.value.api);
  const url = new URL(pathname, getEndpoint(session.auth.env));
  const requestHeaders = new Headers();
  requestHeaders.set("Accept", "application/json");
  if (method === "POST" && body.value.body) {
    requestHeaders.set("Content-Type", "application/json");
  }
  const requestBody = pipe(body.value.body, (body) => {
    switch (method) {
      case "GET":
        return undefined;
      case "POST":
        return JSON.stringify(body);
    }
  });
  const response = await pipe(
    client(url.toString(), {
      headers: requestHeaders,
      method,
      body: requestBody,
    }),
    T.map(unsafeExpect),
    (effect) => effect()
  );
  res.status(200).json({
    status: response.status,
    headers: response.headers.raw(),
    body: response.text(),
  });
};

export default handler;
