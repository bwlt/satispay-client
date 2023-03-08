import crypto from "crypto";
import { date as D, either as E, string as S, taskEither as TE } from "fp-ts";
import { flow, pipe } from "fp-ts/lib/function";
import { HttpClient } from "./client";

function deindent(s: string) {
  return s
    .trim()
    .split("\n")
    .map((s) => s.trimStart())
    .join("\n");
}

export function makeSignedHttpClient(args: {
  keyID: string;
  privateKey: string;
}): (httpClient: HttpClient) => HttpClient {
  return (httpClient) => ({
    request(input, init) {
      const digest = pipe(
        init.body ?? "",
        E.fromPredicate(S.isString, () => new Error("Unsupported body")),
        E.map(
          (s) =>
            `SHA-256=${crypto.createHash("sha256").update(s).digest("base64")}`
        )
      );
      const signatureString = (args: { digest: string; date: Date }) => {
        const method = init.method?.toLowerCase() ?? "get";
        const url = new URL(input.toString());
        return deindent(`
          (request-target): ${method} ${url.pathname}
          host: ${url.host}
          date: ${args.date.toUTCString()}
          digest: ${args.digest}
        `);
      };

      const signature = (signatureString: string) =>
        crypto
          .createSign("RSA-SHA256")
          .update(signatureString)
          .sign(args.privateKey, "base64");

      const authorizationHeader = (signature: string) =>
        `Signature keyId="${args.keyID}", algorithm="rsa-sha256", headers="(request-target) host date digest", signature="${signature}"`;

      return pipe(
        digest,
        TE.fromEither,
        TE.bindTo("digest"),
        TE.bind("date", () => TE.fromIO(D.create)),
        TE.let(
          "authorizationHeader",
          flow(signatureString, signature, authorizationHeader)
        ),
        TE.chain(({ digest, date, authorizationHeader }) =>
          httpClient.request(input, {
            ...init,
            headers: {
              ...init.headers,
              Digest: digest,
              Date: date.toUTCString(),
              Authorization: authorizationHeader,
            },
          })
        )
      );
    },
  });
}
