import { zero } from "fp-ts/ReadonlyArray";
import { keys } from "fp-ts/ReadonlyRecord";
import { isString } from "./string";

export function classnames(
  ...names: Array<string | undefined | Record<string, boolean>>
): string {
  return names
    .reduce((acc, el) => {
      if (isString(el)) {
        return [...acc, el];
      }
      if (el === undefined) {
        return acc;
      }
      return [
        ...acc,
        ...keys(el).reduce(
          (acc, k) => (el[k] ? [...acc, k] : acc),
          zero<string>()
        ),
      ];
    }, zero<string>())
    .join(" ");
}
