import { FormItem } from "../../form-item";
import { Input } from "../../input";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const EntityIDControls: React.FC<Props> = ({
  value,
  onChange,
  label,
}) => (
  <FormItem label={label}>
    <Input
      type="text"
      className="block w-full"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  </FormItem>
);
