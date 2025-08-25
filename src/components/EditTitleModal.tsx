"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useUIStore } from "@/lib/stores/ui";
import { useConversationStore } from "@/lib/stores/conversation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm } from "react-hook-form";

export default function EditTitleModal() {
  const { isOpen, conversationId } = useUIStore((s) => s.editTitle);
  const closeEditTitle = useUIStore((s) => s.closeEditTitle);
  const updateConversationTitle = useConversationStore(
    (s) => s.updateConversationTitle,
  );
  const conversations = useConversationStore((s) => s.conversations);

  const currentTitle = useMemo(() => {
    if (!conversationId) return "";
    return conversations.find((c) => c.id === conversationId)?.title ?? "";
  }, [conversations, conversationId]);

  const inputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: { title: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      reset({ title: currentTitle });
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, currentTitle, reset]);

  const onSubmit = (data: { title: string }) => {
    if (!conversationId) return;
    const trimmed = (data.title || "").trim();
    updateConversationTitle(
      conversationId,
      trimmed.length ? trimmed : "New chat",
    );
    closeEditTitle();
  };

  const handleCancel = () => closeEditTitle();

  // Close on Escape key
  useHotkeys("esc", () => {
    if (isOpen) closeEditTitle();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 shadow-xl rounded-lg max-w-md w-full mx-4 border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Edit chat title
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <form className="p-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            ref={inputRef}
            placeholder="Enter a title"
            {...register("title", {
              validate: (v: string) =>
                (v?.trim()?.length ?? 0) > 0 || "Title is required",
            })}
            error={formState.errors.title?.message}
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={handleCancel}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formState.isValid}
              className="min-w-[80px]"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
