import crypto from "crypto";
import { HttpClient, Headers } from "./httpClient";

function sign(args: {
  host: string;
  method: string;
  path: string;
  body?: string;
  privateKey: string;
  keyId: string;
}) {
  const dateHeader = new Date().toUTCString();
  const { host, method, path, body = "", privateKey, keyId } = args;
  const digest = crypto.createHash("sha256").update(body).digest("base64");
  const digestHeader = `SHA-256=${digest}`;

  const string = `(request-target): ${method.toLowerCase()} ${path}
host: ${host}
date: ${dateHeader}
digest: ${digestHeader}`;

  const signature = crypto
    .createSign("RSA-SHA256")
    .update(string)
    .sign(privateKey, "base64");

  const authorizationHeader = `Signature keyId="${keyId}", algorithm="rsa-sha256", headers="(request-target) host date digest", signature="${signature}"`;
  return { digestHeader, authorizationHeader, dateHeader };
}

export const signedHttpClient: (args: {
  privateKey: string;
  keyId: string;
}) => (client: HttpClient) => HttpClient =
  ({ privateKey, keyId }) =>
  (client) =>
  (input, init = {}) => {
    const { host, pathname, search } = new URL(input);
    const path = pathname + search;
    const { body, headers = new Headers(), method = "GET" } = init;
    const { authorizationHeader, digestHeader, dateHeader } = sign({
      method,
      host,
      path,
      body,
      privateKey,
      keyId,
    });
    headers.set("Authorization", authorizationHeader);
    headers.set("Digest", digestHeader);
    headers.set("Host", host);
    headers.set("Date", dateHeader);
    return client(input, {
      ...init,
      headers,
      body,
    });
  };
