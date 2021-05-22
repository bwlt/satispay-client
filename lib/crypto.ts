import crypto from "crypto";

export function generateKeyPair(): Promise<{
  publicKey: crypto.KeyObject;
  privateKey: crypto.KeyObject;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      { modulusLength: 4096 },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      }
    );
  });
}
