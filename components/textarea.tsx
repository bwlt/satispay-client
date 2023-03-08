import classNames from "classnames";
import { TextareaHTMLAttributes } from "react";

export const Textarea: React.FC<TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={classNames('rounded', props.className)} />
);
