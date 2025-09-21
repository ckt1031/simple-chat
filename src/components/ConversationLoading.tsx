"use client";

import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationLoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ConversationLoading({
  message = "Loading conversation...",
  className,
  size = "md",
}: ConversationLoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        className,
      )}
    >
      <Loader
        className={cn(
          "animate-spin text-neutral-500 dark:text-neutral-400",
          sizeClasses[size],
        )}
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
        {message}
      </p>
    </div>
  );
}
