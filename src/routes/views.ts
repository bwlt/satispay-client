import { RequestHandler } from "express";

export const get: RequestHandler<{ viewName: string }> = (req, res) => {
  const { viewName } = req.params;
  switch (viewName) {
    case "activate":
      return res.render("activate");
    case "api-create-payment":
      return res.render("api-create-payment", {
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
        httpResponse: {
          statusCode: 200,
          headers: {
            "Content-Type": ["application/json"],
            "X-Satispay-Cid": ["hello"],
          },
          data: JSON.stringify({
            id: "41da7b74-a9f4-4d25-8428-0e3e460d90c1",
            code_identifier: "S6Y-PAY--41DA7B74-A9F4-4D25-8428-0E3E460D90C1",
            type: "TO_BUSINESS",
            amount_unit: 100,
            currency: "EUR",
            status: "PENDING",
            expired: false,
            metadata: {
              order_id: "my_order_id",
              user: "my_user_id",
              payment_id: "my_payment",
              session_id: "my_session",
              key: "value",
            },
            sender: {
              type: "CONSUMER",
            },
            receiver: {
              id: "9b14338e-428e-4942-ab7a-3291f3792e56",
              type: "SHOP",
            },
            insert_date: "2019-07-07T09:00:22.814Z",
            expire_date: "2019-07-07T09:15:22.807Z",
            external_code: "my_order_id",
          }),
        },
      });
    default:
      return res.render(viewName);
  }
};
