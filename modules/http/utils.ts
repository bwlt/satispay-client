import { console as C, either as E, taskEither as TE } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { HttpClient } from "./client";

function indent(s: string, char = " ") {
  return `${char} ${s}`;
}

function indentMulti(s: string, char?: string) {
  return s
    .split("\n")
    .map((s) => indent(`${s}`, char))
    .join("\n");
}

export function collectHeaders(
  headers: Headers
): Array<[key: string, value: string]> {
  const headersArray: Array<[key: string, value: string]> = [];
  headers.forEach((value, key) => headersArray.push([key, value]));
  return headersArray;
}

function logRequest(
  url: Parameters<HttpClient["request"]>[0],
  init: RequestInit = {},
  response: Response
): TaskEither<Error, void> {
  const { method = "get" } = init;
  let requestString = "";
  let responseString = "";
  requestString += `${method.toUpperCase()} ${url}\n`;

  const reqHeaders = collectHeaders(new Headers(init.headers));
  if (reqHeaders.length) requestString += "headers:\n";
  requestString += reqHeaders
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  if (init.body) {
    requestString += `\nbody:\n${init.body}`;
  }

  responseString += `status: ${response.status}\n`;
  const resHeaders = collectHeaders(response.headers);
  if (resHeaders.length) responseString += "headers:\n";
  responseString += resHeaders
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  const appendBody = (s: string) =>
    pipe(
      TE.tryCatch(() => response.clone().text(), E.toError),
      TE.map((body) => `${s}\nbody:\n${body}\n`)
    );
  const effect = pipe(
    appendBody(responseString),
    TE.map(
      (responseString) =>
        `${indentMulti(requestString, ">")}\n${indentMulti(
          responseString,
          "<"
        )}`
    ),
    TE.chainIOK(C.log)
  );
  return effect;
}

export function makeLoggedClient(httpClient: HttpClient): HttpClient {
  return {
    request: (url, init) =>
      pipe(
        httpClient.request(url, init),
        TE.chainFirstIOK((response) => logRequest(url, init, response))
      ),
  };
}

export function withBaseUrl(
  baseUrl: URL
): (httpClient: HttpClient) => HttpClient {
  return (httpClient) => {
    return {
      request: (url, init) =>
        httpClient.request(new URL(String(url), baseUrl), init),
    };
  };
}
