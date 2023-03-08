import { either as E, ioOption as IO, json as J, option as O } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import {
  ChangeEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
} from "react";
import { Button } from "../../button";
import { FormItem } from "../../form-item";
import { Textarea } from "../../textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
}

export const BodyControls: React.FC<Props> = ({ value, onChange, isDisabled }) => {
  const prettifiedBody = useMemo(() => {
    return pipe(
      value,
      J.parse,
      E.map((json) => JSON.stringify(json, null, 2)),
      O.fromEither
    );
  }, [value]);

  const prettifyButtonDisabled =
    isDisabled ||
    pipe(
      prettifiedBody,
      O.exists((prettifiedBody) => prettifiedBody === value)
    );

  const handleTextareaChange: ChangeEventHandler<HTMLTextAreaElement> =
    useCallback((ev) => onChange(ev.currentTarget.value), [onChange]);

  const handlePrettifyClick: MouseEventHandler = useCallback(
    () =>
      pipe(
        prettifiedBody,
        IO.fromOption,
        IO.chainIOK((body) => () => onChange(body)),
        (effect) => effect()
      ),
    [onChange, prettifiedBody]
  );

  return (
    <>
      <FormItem label="Body">
        <Textarea
          className="block w-full"
          rows={value.split("\n").length}
          value={value}
          onChange={handleTextareaChange}
        />
      </FormItem>
      <Button disabled={prettifyButtonDisabled} onClick={handlePrettifyClick}>
        Prettify
      </Button>
    </>
  );
};
