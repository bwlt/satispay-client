import { array, option } from "fp-ts";
import { Option } from "fp-ts/lib/Option";
import { pipe, tuple } from "fp-ts/lib/function";

type AtLeastTwoArray<A> = [A, A, ...A[]];

export function fromArray<A>(arr: Array<A>): Option<AtLeastTwoArray<A>> {
  return pipe(
    option.Do,
    option.bind("fst", () => array.lookup(0, arr)),
    option.bind("snd", () => array.lookup(1, arr)),
    option.let("tail", () => pipe(arr, array.dropLeft(2))),
    option.map(({ fst, snd, tail }) => tuple(fst, snd, ...tail))
  );
}

export const map: <A, B>(
  f: (a: A) => B
) => (fa: AtLeastTwoArray<A>) => AtLeastTwoArray<B> = array.map as any;
