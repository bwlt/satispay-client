type Props = {
  children?: React.ReactNode;
  label: React.ReactNode;
};

export const FormItem: React.FC<Props> = (props) => (
  <label className="block">
    <span className="text-gray-700 inline-block mb-2">{props.label}</span>
    {props.children}
  </label>
);
