import { GetServerSideProps } from "next";
import Head from "next/head";
import { useState } from "react";
import { API, getPathnameAndMethodByAPI, isAPI } from "../lib/API";
import { Env, getEndpoint } from "../lib/satispay";
import { getSession } from "../lib/session";
import * as RA from "fp-ts/ReadonlyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import { pipe } from "fp-ts/function";
import Button from "../components/button";
import Select from "../components/select";
import Textarea from "../components/textarea";
import * as J from "fp-ts/lib/Json";
import * as E from "fp-ts/lib/Either";
import { isJsonRecord } from "../lib/Json";
import * as O from "fp-ts/lib/Option";
import { Body, Response } from "./api/_api-call";
import { H1 } from "../components/typography/h1";
import { unsafeExpect } from "../lib/Either";
import * as T from "fp-ts/lib/Task";

interface Props {
  env: Env;
}

const defaultBodyByApi: Record<API, string> = {
  CreatePayment: JSON.stringify(
    {
      flow: "MATCH_CODE",
      amount_unit: 100,
      currency: "EUR",
      external_code: "my_order_id",
      callback_url: "https://myServer.com/myCallbackUrl?payment_id={uuid}",
      metadata: {
        redirect_url: "https://myServer.com/myRedirectUrl",
        order_id: "my_order_id",
        user: "my_user_id",
        payment_id: "my_payment",
        session_id: "my_session",
        key: "value",
      },
    },
    null,
    2
  ),
  CreateAuthorization: JSON.stringify(
    {
      reason: "Monthly payment",
      callback_url: "https://myServer.com/myCallbackUrl/{uuid}",
    },
    null,
    2
  ),
  TestAuthentication: "{}",
  ListPayments: "{}",
};

export default function Home(props: Props) {
  const [api, setApi] = useState<API>("CreatePayment");
  const [bodies, setBodies] = useState(defaultBodyByApi);
  const [lastResponse, setLastResponse] = useState<Response>();

  const handleApiChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const { value } = e.currentTarget;
    if (isAPI(value)) {
      setApi(value);
      setLastResponse(undefined);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const parsed = pipe(J.parse(body), O.fromEither, O.filter(isJsonRecord));
    if (O.isNone(parsed)) return;
    const response = await fetch("/api/api-call", {
      body: JSON.stringify(Body.encode({ api, body: parsed.value })),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).then((a) => a.json());
    setLastResponse(response);
  };

  const handleBodyChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    const { value } = e.currentTarget;
    setBodies({ ...bodies, [api]: value });
  };

  const handleResetClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setBodies({ ...bodies, [api]: defaultBodyByApi[api] });
  };

  const handleSubmitClick: React.MouseEventHandler<HTMLButtonElement> =
    () => {};

  const makeLabel = (args: { method: string; pathname: string }) => {
    return `${args.method} ${new URL(
      args.pathname,
      getEndpoint(props.env)
    ).toString()}`;
  };

  const body = bodies[api];
  const resetButtonDisabled = body === defaultBodyByApi[api];

  const validBody = pipe(J.parse(body), E.isRight);

  const { method } = getPathnameAndMethodByAPI(api);

  return (
    <>
      <Head>
        <title>Satispay Client</title>
        <meta name="description" content="Satispay Client" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto flex flex-col items-center space-y-4 my-4">
        <H1>Satispay Client</H1>
        <form
          className="flex flex-col space-y-4 w-24 min-w-full"
          onSubmit={handleSubmit}
        >
          <Select value={api} onChange={handleApiChange}>
            {pipe(
              API.keys,
              RR.keys,
              RA.map((k) => (
                <option key={k} value={k}>
                  {makeLabel(getPathnameAndMethodByAPI(k))}
                </option>
              ))
            )}
          </Select>
          {method !== "GET" && (
            <>
              <Textarea
                rows={body.split("\n").length}
                value={body}
                onChange={handleBodyChange}
              />
              <Button onClick={handleResetClick} disabled={resetButtonDisabled}>
                reset body
              </Button>
            </>
          )}
          <Button
            onClick={handleSubmitClick}
            disabled={!validBody}
            type="submit"
          >
            submit
          </Button>
        </form>
        {pipe(
          O.fromNullable(lastResponse),
          O.map((lastResponse) => {
            const prettyBody = JSON.stringify(
              JSON.parse(lastResponse.body),
              null,
              2
            );
            return (
              <>
                <hr className="h-4" />
                <div className="container">
                  <ul className="list-inside">
                    <li>Status code: {lastResponse.status}</li>
                    <li>
                      Headers:
                      <ul>
                        {pipe(
                          lastResponse.headers,
                          RR.collect((k, as) =>
                            pipe(
                              as,
                              RA.mapWithIndex((idx, a) => (
                                <li key={`${k}.${idx}`} className="font-mono">
                                  {k}: {a}
                                </li>
                              ))
                            )
                          ),
                          RA.flatten
                        )}
                      </ul>
                    </li>
                    <li>
                      Body:{" "}
                      <Textarea
                        className="block min-w-full"
                        readOnly
                        rows={prettyBody.split("\n").length}
                        value={prettyBody}
                      />
                    </li>
                  </ul>
                </div>
              </>
            );
          }),
          O.toNullable
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const session = await pipe(getSession(), T.map(unsafeExpect), (effect) =>
    effect()
  );
  if (session.type !== "LOGGED_IN") {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }
  return {
    props: {
      env: session.auth.env,
    },
  };
};
