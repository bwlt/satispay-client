import * as https from "https";
import * as crypto from "crypto";

export interface HttpRequest {
  url: string;
  options?: {
    body?: string;
    headers?: Record<string, string>;
    method?: "GET" | "POST";
  };
}

export interface HttpResponse {
  ok: boolean;
  data: string;
  headers: Record<string, string[]>;
  statusCode: number;
}

export interface HttpClient {
  (httpRequest: HttpRequest): Promise<HttpResponse>;
}

export const request: HttpClient = function ({ url, options = {} }) {
  const { body, headers = {}, method = "GET" } = options;
  return new Promise<HttpResponse>((resolve, reject) => {
    https
      .request(url, { method, headers }, (res) => {
        const headers: Record<string, string[]> = {};
        for (const name in res.headers) {
          const value = res.headers[name];
          if (typeof value === "string") headers[name] = [value];
          else if (Array.isArray(value)) headers[name] = value;
        }
        const statusCode = res.statusCode || 0;
        const ok = 200 <= statusCode && statusCode <= 299;
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("error", reject);
        res.on("end", () => resolve({ ok, data, headers, statusCode }));
      })
      .end(body);
  });
};

export const withLog: (httpClient: HttpClient) => HttpClient = (httpClient) => (
  httpRequest
) => {
  console.log("request", httpRequest);
  return httpClient(httpRequest).then((httpResponse) => {
    console.log("response", httpResponse);
    return httpResponse;
  });
};

export const httpClient = withLog(request);

export function sign(options: {
  keyId: string;
  privateKey: string;
}): (httpRequest: HttpRequest) => HttpRequest {
  const { keyId, privateKey } = options;
  return (httpRequest) => {
    const { options = {} } = httpRequest;
    const { body = "", method = "GET", headers = {} } = options;
    const digest = crypto.createHash("sha256").update(body).digest("base64");
    const { host, pathname } = new URL(httpRequest.url);
    const date = new Date().toUTCString();
    const string = `(request-target): ${method.toLowerCase()} ${pathname}
host: ${host}
date: ${date}
digest: SHA-256=${digest}`;
    const signature = crypto
      .createSign("RSA-SHA256")
      .update(string)
      .sign(privateKey, "base64");
    const authorizationHeader = `Signature keyId="${keyId}", algorithm="rsa-sha256", headers="(request-target) host date digest", signature="${signature}"`;

    return {
      url: httpRequest.url,
      options: {
        method,
        body: options.body,
        headers: {
          ...headers,
          authorization: authorizationHeader,
          digest: `SHA-256=${digest}`,
          host,
          date,
        },
      },
    };
  };
}

export function signedClient(options: {
  keyId: string;
  privateKey: string;
}): (httpClient: HttpClient) => HttpClient {
  return (httpClient) => (httpRequest) =>
    httpClient(sign(options)(httpRequest));
}
