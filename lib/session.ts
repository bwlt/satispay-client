import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as J from "fp-ts/lib/Json";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import keytar from "keytar";
import { b64decode, b64encode } from "./Buffer";
import { Env } from "./satispay";

const KEYTAR_SERVICE_NAME = "satispay-api-demo-dev";
const KEYTAR_ACCOUNT = "session";

export interface LoggedOutSession {
  type: "LOGGED_OUT";
}

const LoggedOutSession: LoggedOutSession = { type: "LOGGED_OUT" };

export interface LoggedInSession {
  type: "LOGGED_IN";
  auth: AuthData;
}

const LoggedInSession: (auth: LoggedInSession["auth"]) => LoggedInSession = (
  auth
) => {
  return {
    type: "LOGGED_IN",
    auth,
  };
};

export type Session = LoggedOutSession | LoggedInSession;

let session: null | Session = null;

const AuthData = t.type({
  publicKey: t.string,
  privateKey: t.string,
  keyId: t.string,
  env: Env,
});

type AuthData = t.TypeOf<typeof AuthData>;

export function getSession(): TE.TaskEither<Error, Readonly<Session>> {
  if (session) return TE.right(session);
  const effect = pipe(
    TE.tryCatch(
      () => keytar.getPassword(KEYTAR_SERVICE_NAME, KEYTAR_ACCOUNT),
      E.toError
    ),
    TE.map(
      flow(
        O.fromNullable,
        O.chain(flow(b64decode, J.parse, O.fromEither)),
        O.filter(AuthData.is),
        O.map(LoggedInSession),
        O.getOrElseW(() => LoggedOutSession)
      )
    )
  );
  return effect;
}

export function signIn(auth: AuthData): TE.TaskEither<Error, void> {
  session = LoggedInSession(auth);
  return pipe(
    AuthData.encode(auth),
    J.stringify,
    E.mapLeft(E.toError),
    E.map(b64encode),
    TE.fromEither,
    TE.chain((password) =>
      TE.tryCatch(
        () => keytar.setPassword(KEYTAR_SERVICE_NAME, KEYTAR_ACCOUNT, password),
        E.toError
      )
    )
  );
}

export function signOut(): TE.TaskEither<Error, boolean> {
  session = LoggedOutSession;

  return TE.tryCatch(
    () => keytar.deletePassword(KEYTAR_SERVICE_NAME, KEYTAR_ACCOUNT),
    E.toError
  );
}
