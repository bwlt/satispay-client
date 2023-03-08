import classNames from "classnames";
import { InputHTMLAttributes } from "react";

export const Input: React.FC<InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={classNames("rounded", props.className)} />
);
