import { pipe } from "fp-ts/lib/function";
import { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";
import { HttpRestClient } from "./http";

export const ENDPOINTS = {
  production: "https://authservices.satispay.com/",
  sandbox: "https://staging.authservices.satispay.com/",
} as const;

type Satispay = {
  postAuthenticationKeys: (args: {
    publicKey: string;
    token: string;
  }) => TaskEither<Error, AuthenticationKey>;
};

const AuthenticationKey = t.type({
  key_id: t.string,
});

type AuthenticationKey = t.TypeOf<typeof AuthenticationKey>;

export function makeSatispayClient(httpRestClient: HttpRestClient): Satispay {
  return {
    postAuthenticationKeys: ({ publicKey, token }) =>
      pipe(
        httpRestClient.post(
          "/g_business/v1/authentication_keys",
          {
            public_key: publicKey,
            token,
          },
          AuthenticationKey
        )
      ),
  };
}
