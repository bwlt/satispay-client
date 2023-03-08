import crypto from "crypto";
import { either as E } from "fp-ts";
import { TaskEither } from "fp-ts/lib/TaskEither";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export const generateKeyPair: TaskEither<Error, KeyPair> = () =>
  new Promise((resolve) =>
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 4096,
      },
      (err, publicKey, privateKey) => {
        if (err) {
          resolve(E.left(err));
        } else {
          resolve(
            E.right({
              publicKey: publicKey
                .export({ type: "pkcs1", format: "pem" })
                .toString(),
              privateKey: privateKey
                .export({ type: "pkcs1", format: "pem" })
                .toString(),
            })
          );
        }
      }
    )
  );
