import { RequestInit } from "./httpClient";
import * as t from "io-ts";

export const API = t.keyof({
  CreatePayment: null,
  ListPayments: null,
  CreateAuthorization: null,
  TestAuthentication: null,
});

export type API = t.TypeOf<typeof API>;

export function isAPI(a: string): a is API {
  return a in API.keys;
}

export function getPathnameAndMethodByAPI(api: API): {
  method: NonNullable<RequestInit["method"]>;
  pathname: string;
} {
  switch (api) {
    case "CreatePayment":
      return { method: "POST", pathname: "/g_business/v1/payments" };
    case "CreateAuthorization":
      return {
        method: "POST",
        pathname: "/g_business/v1/pre_authorized_payment_tokens",
      };
    case "ListPayments":
      return {
        method: "GET",
        pathname: "/g_business/v1/payments",
      };
    case "TestAuthentication":
      return {
        method: "GET",
        pathname: "/wally-services/protocol/tests/signature",
      };
  }
}
