import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600",
            "border-neutral-300 dark:border-neutral-700",
            error && "border-red-500 dark:border-red-400",
            className,
          )}
          {...props}
        />
        {helperText && (
          <div className="text-xs text-neutral-500">{helperText}</div>
        )}
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
