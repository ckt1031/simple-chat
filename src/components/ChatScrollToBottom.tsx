"use client";

import { useEffect, useState, type RefObject } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatScrollToBottomProps {
  targetRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  className?: string;
}

export default function ChatScrollToBottom({
  targetRef,
  onClick,
  className,
}: ChatScrollToBottomProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = targetRef.current?.parentElement;
    if (!container) return;
    const onScroll = () => {
      const nearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100;
      setVisible(!nearBottom);
    };
    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [targetRef]);

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 bottom-20 pointer-events-none transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "pointer-events-auto flex items-center justify-center p-2 rounded-full shadow-lg",
          "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600",
          "dark:border dark:border-neutral-600",
        )}
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
  );
}
