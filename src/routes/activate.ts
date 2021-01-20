import { Handler, RequestHandler } from "express";
import { generateKeyPair } from "../lib/crypto";
import { wrapAsyncHandler } from "../lib/express";
import { postAuthenticationKeys } from "../lib/satispay";

declare module "express-session" {
  interface SessionData {
    data: {
      publicKey: string;
      privateKey: string;
      keyId: string;
      environment: "sandbox" | "production";
    };
  }
}

interface ReqBody {
  activation_code: string;
  environment: "sandbox" | "production";
}

export const post = wrapAsyncHandler(<
  RequestHandler<unknown, unknown, ReqBody>
>(async (req, res) => {
  const { body } = req;
  const keyPair = await generateKeyPair();
  const { privateKey, publicKey } = keyPair;
  const publicKeyString = publicKey
    .export({ format: "pem", type: "pkcs1" })
    .toString();
  const privateKeyString = privateKey
    .export({ format: "pem", type: "pkcs1" })
    .toString();
  const response = await postAuthenticationKeys({
    public_key: publicKeyString,
    token: body.activation_code,
    environment: body.environment,
  });
  req.session.data = {
    privateKey: privateKeyString,
    publicKey: publicKeyString,
    keyId: response.key_id,
    environment: body.environment,
  };
  res.redirect("/");
}));

export const get: Handler = (_, res) => res.render("activate");
