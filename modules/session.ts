import { IO } from "fp-ts/IO";
import { KeyPair } from "./crypto";
import { ENDPOINTS } from "./satispay";
import { GlobalRef } from "./utils";

type AuthUnauthenticated = {
  state: "unauthenticated";
};
const AuthUnauthenticated: AuthUnauthenticated = {
  state: "unauthenticated",
};

type AuthAuthenticated = {
  state: "authenticated";
  endpoint: keyof typeof ENDPOINTS;
  keyID: string
  keyPair: KeyPair;
};
const AuthAuthenticated: (args: {
  endpoint: AuthAuthenticated["endpoint"];
  keyPair: AuthAuthenticated["keyPair"];
  keyID: string;
}) => AuthAuthenticated = ({ endpoint, keyPair, keyID }) => ({
  state: "authenticated",
  endpoint,
  keyID,
  keyPair,
});

type Auth = AuthUnauthenticated | AuthAuthenticated;

type Store = {
  auth: Auth;
};

const storeRef = new GlobalRef<Store>("app.store");
if (!storeRef.value) {
  storeRef.value = { auth: AuthUnauthenticated };
}

export const setAuthenticated: (
  args: Parameters<typeof AuthAuthenticated>[0]
) => IO<void> = (args: Parameters<typeof AuthAuthenticated>[0]) => () => {
  storeRef.value.auth = AuthAuthenticated(args);
};

export const getAuth: IO<Auth> = () => {
  return storeRef.value.auth;
};

export function isAuthenticated(auth: Auth): auth is AuthAuthenticated {
  return auth.state === "authenticated";
}
