import * as E from "fp-ts/lib/Either";
import { constVoid, pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { useRouter } from "next/dist/client/router";
import Head from "next/head";
import { useState } from "react";
import Button from "../components/button";
import Input from "../components/input";
import Select from "../components/select";
import { H1 } from "../components/typography/h1";

const Login: React.FC = () => {
  const [activationCodeValue, setActivationCodeValue] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [submitError, setSubmitError] = useState<string>();
  const router = useRouter();

  const handleSubmit: React.FormEventHandler = (e) => {
    const token = activationCodeValue.trim().toUpperCase();
    const effect = pipe(
      () => e.preventDefault(),
      TE.fromIO,
      TE.chain(() =>
        TE.tryCatch(
          () =>
            fetch("/api/login", {
              body: JSON.stringify({ token: token, env: environment }),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            }),
          E.toError
        )
      ),
      TE.filterOrElse(
        (a) => a.ok,
        () => new Error("Invalid response")
      ),
      TE.chainTaskK(() => () => router.push("/")),
      TE.getOrElseW(() =>
        T.fromIO(() => setSubmitError("Something went wrong, please retry"))
      )
    );
    effect();
  };

  const valid = /^[a-z0-9]{6}$/i.test(activationCodeValue.trim());

  return (
    <>
      <Head>
        <title>Satispay Client - Login</title>
        <meta name="description" content="Satispay Client" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto flex flex-col items-center m-4 space-y-4">
        <H1>Satispay Client</H1>
        <form
          className="flex flex-col gap-4 w-24 min-w-full"
          onSubmit={handleSubmit}
        >
          <Select
            value={environment}
            onChange={(e) => setEnvironment(e.currentTarget.value)}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </Select>
          <Input
            autoFocus
            type="text"
            placeholder="Enter activation code"
            onChange={(e) =>
              setActivationCodeValue(e.currentTarget.value.toUpperCase())
            }
            value={activationCodeValue}
          />
          {submitError && <p className="text-red-500">{submitError}</p>}
          <Button disabled={!valid} type="submit">
            Submit
          </Button>
        </form>
      </main>
    </>
  );
};

export default Login;
