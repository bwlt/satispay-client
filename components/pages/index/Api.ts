import { option } from "fp-ts";
import { flow, pipe } from "fp-ts/function";
import * as t from 'io-ts';
import * as atLeastTwoArray from "../../../helpers/at-least-two-array";
import { unsafeUnwrap } from "../../../lib/fp-ts/Option";
import { InvokeBody } from "../../../pages/api/invoke";

export const Api = pipe(
  InvokeBody.types,
  atLeastTwoArray.fromArray,
  option.map(
    flow(
      atLeastTwoArray.map((t) => t.props.api),
      (c) => t.union(c)
    )
  ),
  unsafeUnwrap
);

export type Api = t.TypeOf<typeof Api>;