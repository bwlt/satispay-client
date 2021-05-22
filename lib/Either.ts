import { Either } from "fp-ts/lib/Either";
import { isLeft } from "fp-ts/lib/These";

export function unsafeExpect<A>(fa: Either<Error, A>): A {
  if (isLeft(fa)) throw fa.left;
  else return fa.right;
}
