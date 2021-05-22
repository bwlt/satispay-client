import { constVoid } from "fp-ts/function";
import React, { useState } from "react";
import { classnames } from "../lib/classnames";

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (
  props
) => {
  const { onClick = constVoid } = props;

  const [loading, setLoading] = useState(false);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setLoading(true);
    Promise.resolve(onClick(e)).finally(() => {
      setLoading(false);
    });
  };

  return (
    <button
      disabled={loading}
      {...props}
      onClick={handleClick}
      className={classnames(
        "border rounded text-white uppercase tracking-widest bg-blue-600 p-2 transition disabled:opacity-50",
        props.className
      )}
    />
  );
};

export default Button