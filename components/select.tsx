import classNames from "classnames";
import { SelectHTMLAttributes } from "react";

export const Select: React.FC<SelectHTMLAttributes<unknown>> = (props) => (
  <select
    {...props}
    className={classNames("px-3 py-2 rounded", props.className)}
  />
);
