import { classnames } from "../lib/classnames";

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...props
}) => (
  <textarea
    className={classnames("border rounded border-gray resize-none", className)}
    {...props}
  />
);

export default Textarea;
