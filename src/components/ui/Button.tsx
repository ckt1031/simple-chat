import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "secondary", size = "md", children, ...props },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-100",
      secondary:
        "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800",
      danger:
        "border border-red-300 text-red-700 bg-white hover:bg-red-100 hover:text-red-800 dark:border-red-900 dark:text-red-200 dark:bg-transparent dark:hover:bg-red-900/30 dark:hover:text-red-100",
      ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-2 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
