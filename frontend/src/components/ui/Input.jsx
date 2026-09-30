"use client";

import React from "react";

const Input = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full rounded border border-border px-3 py-2 outline-none focus:border-ring ${className}`.trim()}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
