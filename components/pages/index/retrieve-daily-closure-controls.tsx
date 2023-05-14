import { ChangeEventHandler, useCallback } from "react";
import { format } from "../../../helpers/date";
import { Checkbox } from "../../checkbox";
import { FormItem } from "../../form-item";
import { Input } from "../../input";
import { FormState } from "./page";

type Value = FormState["payload"]["retrieve-daily-closure"];

type Props = {
  value: Value;
  onChange: (value: Value) => void;
};

export const RetrieveDailyClosureControls: React.FC<Props> = (props) => {
  const { value, onChange } = props;

  const handleDateChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      onChange({
        ...value,
        date: new Date(event.currentTarget.value),
      });
    },
    [value, onChange]
  );

  const handleGeneratePdfChange = useCallback(
    (checked: boolean) => {
      onChange({ ...value, generatePdf: checked });
    },
    [value, onChange]
  );

  return (
    <>
      <FormItem label="Daily closure date">
        <Input
          className="block w-full"
          type="date"
          value={format("date", props.value.date)}
          onChange={handleDateChange}
        />
      </FormItem>
      <FormItem>
        <Checkbox
          onChange={handleGeneratePdfChange}
          checked={props.value.generatePdf}
        >
          Generate pdf
        </Checkbox>
      </FormItem>
    </>
  );
};
