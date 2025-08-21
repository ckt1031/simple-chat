"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type AlertVariant = "error" | "warning" | "info" | "success";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
}

export default function Alert({
  variant = "info",
  title,
  className,
  compact = false,
  children,
}: AlertProps) {
  const base =
    "w-full rounded-md border text-sm" +
    (compact ? " px-2 py-1.5" : " px-3 py-2");

  const variantClasses: Record<AlertVariant, string> = {
    error:
      "border-red-300 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200",
    warning:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200",
    info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200",
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200",
  };

  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : undefined}
      className={cn(base, variantClasses[variant], className)}
    >
      {title && <div className="font-medium mb-0.5 leading-5">{title}</div>}
      {children && <div className="leading-5">{children}</div>}
    </div>
  );
}
