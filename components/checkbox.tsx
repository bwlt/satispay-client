import { ChangeEventHandler, PropsWithChildren, useCallback } from "react";
import { Input } from "./input";

type Props = PropsWithChildren<{
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}>;

export const Checkbox: React.FC<Props> = (props) => {
  const { onChange } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      onChange?.(event.currentTarget.checked);
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-1">
      <Input type="checkbox" checked={props.checked} onChange={handleChange} />
      {props.children}
    </div>
  );
};
