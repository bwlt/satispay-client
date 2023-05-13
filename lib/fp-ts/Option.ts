import { option } from "fp-ts";
import { Option } from "fp-ts/lib/Option";

export function unsafeUnwrap<A>(fa: Option<A>): A {
  if (option.isSome(fa)) return fa.value;
  else throw new Error("Unwrap error");
}
