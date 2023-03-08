import classNames from "classnames";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

export const Button: React.FC<Props> = ({ isLoading, ...props }) => (
  <button
    {...props}
    className={classNames(
      "disabled:bg-slate-400 text-white py-2.5 rounded transition-colors",
      isLoading ? "bg-slate-400" : "bg-slate-500",
      props.className
    )}
  />
);
