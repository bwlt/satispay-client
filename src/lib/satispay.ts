import { httpClient, HttpClient, HttpResponse } from "./request";

function getUrl(path: string, environment: "sandbox" | "production"): string {
  const base =
    environment === "sandbox"
      ? "https://staging.authservices.satispay.com/g_business"
      : "https://authservices.satispay.com";
  return new URL(path, base).toString();
}

export function postAuthenticationKeys(args: {
  public_key: string;
  token: string;
  environment: "sandbox" | "production";
}): Promise<{ key_id: string }> {
  const url = getUrl("/g_business/v1/authentication_keys", args.environment);
  return httpClient({
    url,
    options: {
      body: JSON.stringify({ public_key: args.public_key, token: args.token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  }).then((a) => {
    if (a.ok) return JSON.parse(a.data);
    else throw new Error(`Unexpected response. status: ${a.statusCode} `);
  });
}

export function postPayment(args: {
  environment: "sandbox" | "production";
  client: HttpClient;
  body: string;
}): Promise<HttpResponse> {
  const url = getUrl("/g_business/v1/payments", args.environment);
  return args.client({
    url,
    options: {
      body: args.body,
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  });
}
