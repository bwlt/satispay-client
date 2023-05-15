import { array, ioOption, nonEmptyArray, ord, record } from "fp-ts";
import { pipe } from "fp-ts/function";
import { ChangeEventHandler, useCallback } from "react";
import { Select } from "../../select";
import { Api } from "./Api";

type Group = "Payments" | "Pre-authorized" | "Shop details";

const optionsMap: Record<Api, { group: Group; label: string }> = {
  "create-payment": { group: "Payments", label: "Create payment" },
  "get-list-of-payments": { group: "Payments", label: "Get list of payment" },
  "get-payment-details": { group: "Payments", label: "Get payment detals" },
  "update-payment": { group: "Payments", label: "Update payment" },
  "retrieve-daily-closure": {
    group: "Shop details",
    label: "Retrieve daily closure",
  },
  "create-authorization": {
    group: "Pre-authorized",
    label: "Create authorization",
  },
  "get-authorization": {
    group: "Pre-authorized",
    label: "Get authorization",
  },
  "update-authorization": {
    group: "Pre-authorized",
    label: "Update authorization",
  },
};

const options = pipe(
  optionsMap,
  record.collect(ord.fromCompare(() => 0))((api, { label, group }) => ({
    api,
    label,
    group,
  })),
  nonEmptyArray.groupBy((a) => a.group),
  record.mapWithIndex((group, arr) => (
    <optgroup key={group} label={group}>
      {pipe(
        arr,
        array.map((a) => (
          <option key={a.api} value={a.api}>
            {a.label}
          </option>
        ))
      )}
    </optgroup>
  )),
  record.collect(ord.fromCompare(() => 0))((_, el) => el),
  (els) => <>{els}</>
);

type Props = {
  value: Api;
  onChange: (api: Api) => void;
};

export const ApiSelect: React.FC<Props> = (props) => {
  const { onChange } = props;
  const handleChange: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      const effect = pipe(
        event.currentTarget.value,
        ioOption.fromPredicate(Api.is),
        ioOption.chainIOK((api) => () => onChange(api))
      );
      effect();
    },
    [onChange]
  );

  return (
    <Select
      className="block w-full"
      value={props.value}
      onChange={handleChange}
    >
      {options}
    </Select>
  );
};
