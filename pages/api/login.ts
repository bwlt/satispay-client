import * as E from "fp-ts/lib/Either";
import { NextApiHandler } from "next";
import { generateKeyPair } from "../../lib/crypto";
import { postAuthenticationKeys, Env } from "../../lib/satispay";
import { signIn } from "../../lib/session";

const handler: NextApiHandler<{ ok: boolean }> = async (req, res) => {
  const body: { token: string; env: Env } = req.body;
  const keyPair = await generateKeyPair();
  const publicKey = keyPair.publicKey
    .export({ type: "pkcs1", format: "pem" })
    .toString();
  const privateKey = keyPair.privateKey
    .export({ type: "pkcs1", format: "pem" })
    .toString();
  const result = await postAuthenticationKeys(body.env, {
    token: body.token,
    public_key: publicKey,
  })();
  if (E.isLeft(result)) throw result.left;
  signIn({ publicKey, privateKey, keyId: result.right.key_id, env: body.env });
  res.status(200).json({ ok: true });
};

export default handler;
