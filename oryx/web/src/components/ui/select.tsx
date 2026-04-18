import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[#A259FF]/45 focus:ring-2 focus:ring-[#A259FF]/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Select.displayName = "Select";

export { Select };
