"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";

interface ChatEditProps {
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
  placeholder?: string;
}

export default function ChatEdit({
  initialValue,
  onCancel,
  onSave,
  placeholder = "Edit your message...",
}: ChatEditProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useHotkeys("esc", () => onCancel());
  useHotkeys("shift+enter", () => submit(), { enableOnFormTags: ["TEXTAREA"] });

  const submit = () => {
    onSave(textareaRef.current?.value.trim() ?? "");
  };

  return (
    <div className="py-1 max-h-[350px] sm:min-w-[400px] md:min-w-[500px]">
      <textarea
        ref={textareaRef}
        defaultValue={initialValue}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none focus:outline-none text-sm leading-relaxed",
          "placeholder-neutral-500 dark:placeholder-neutral-400",
          "pr-0.5 h-[250px]",
        )}
        rows={1}
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:opacity-80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="px-3 py-1.5 text-sm rounded-full bg-neutral-900 text-white dark:text-black hover:opacity-80 dark:bg-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
