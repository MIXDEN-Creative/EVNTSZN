import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex h-7 w-12 cursor-pointer items-center", className)}>
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full bg-white/15 transition peer-checked:bg-[#A259FF]/65" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:left-6" />
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
