import { Handler, RequestHandler } from "express";
import { render, wrapAsyncHandler } from "../lib/express";
import { httpClient, signedClient } from "../lib/request";
import { postPayment } from "../lib/satispay";

export const get: Handler = (_, res) =>
  render(res, "api-create-payment", {
    body: JSON.stringify({
      flow: "MATCH_CODE",
      amount_unit: 100,
      currency: "EUR",
      external_code: "my_order_id",
      callback_url: "https://myServer.com/myCallbackUrl?payment_id={uuid}",
      metadata: {
        order_id: "my_order_id",
        user: "my_user_id",
        payment_id: "my_payment",
        session_id: "my_session",
        key: "value",
      },
    }),
  });

interface ReqBody {
  body: string;
}

export const post = wrapAsyncHandler(<
  RequestHandler<unknown, unknown, ReqBody>
>(async (req, res, next) => {
  if (!req.session.data) return next(new Error("Missing session data"));
  const { environment, keyId, privateKey } = req.session.data;
  const body = JSON.stringify(JSON.parse(req.body.body));
  const httpResponse = await postPayment({
    environment,
    body,
    client: signedClient({ keyId, privateKey })(httpClient),
  });
  return render(res, "api-create-payment", { body, httpResponse });
}));
