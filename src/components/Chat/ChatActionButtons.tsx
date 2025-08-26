import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, PencilLine, RefreshCcw, Trash } from "lucide-react";
import { useConversationStore } from "@/lib/stores/conversation";
import { useUIStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";
import isMobile from "@/lib/is-mobile";

interface ChatActionButtonsProps {
  isRegenerating?: boolean;
  isGenerating?: boolean;

  messageId: string;
  conversationId: string;

  handleRegenerate: () => void;
  onEdit?: () => void;
}

function ChatActionButtons({
  handleRegenerate,
  isRegenerating = false,
  isGenerating = false,
  messageId,
  onEdit,
}: ChatActionButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLastMessage = useConversationStore((s) => s.isLastMessage);
  const deleteMessage = useConversationStore((s) => s.deleteMessage);
  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);

  // Show the buttons when the mouse is within 60px of the container (top/bottom/left/right)
  // This is a simple "proximity" effect using mousemove on the document.
  // For more advanced/production use, consider a library or a custom hook.

  // We'll use a state to control visibility
  const isDeviceMobile = useMemo(() => isMobile(), []);
  const [visible, setVisible] = useState(isDeviceMobile);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current || isDeviceMobile) return;
      const rect = containerRef.current.getBoundingClientRect();
      const proximity = 60; // px
      const withinProximity =
        e.clientX >= rect.left - proximity &&
        e.clientX <= rect.right + proximity &&
        e.clientY >= rect.top - proximity &&
        e.clientY <= rect.bottom + proximity;
      setVisible(withinProximity);
    }
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleDelete = () => {
    openDeleteConfirmation(
      "Delete Message",
      "Are you sure you want to delete this message? This action cannot be undone.",
      () => deleteMessage(messageId),
    );
  };

  const [copied, setCopied] = useState(false);

  const handleCopyInternal = async () => {
    try {
      const state = useConversationStore.getState();
      const message = state.currentMessages.find((m) => m.id === messageId);
      if (!message) return;
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex space-x-2 mt-1 px-2 transition-opacity duration-200",
        "font-light",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        onClick={handleDelete}
        disabled={isGenerating}
        className={cn(
          "transition-colors",
          isGenerating
            ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
        )}
        title={
          isGenerating ? "Cannot delete while generating" : "Delete message"
        }
      >
        <Trash size={16} strokeWidth={1.5} />
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          disabled={isGenerating}
          className={cn(
            "transition-colors",
            isGenerating
              ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
          )}
          title={isGenerating ? "Cannot edit while generating" : "Edit message"}
        >
          <PencilLine size={16} strokeWidth={1.5} />
        </button>
      )}
      <button
        onClick={handleCopyInternal}
        disabled={isGenerating}
        className={cn(
          "transition-colors",
          isGenerating
            ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
        )}
        title={
          isGenerating
            ? "Cannot copy while generating"
            : copied
              ? "Copied!"
              : "Copy message"
        }
      >
        {copied ? (
          <Check size={16} strokeWidth={1.5} />
        ) : (
          <Copy size={16} strokeWidth={1.5} />
        )}
      </button>
      {isLastMessage(messageId) && (
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isGenerating}
          className={cn(
            "transition-colors",
            isRegenerating || isGenerating
              ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
          )}
          title={
            isGenerating
              ? "Cannot regenerate while generating"
              : isRegenerating
                ? "Regenerating..."
                : "Regenerate response"
          }
        >
          <RefreshCcw
            size={16}
            className={isRegenerating ? "animate-spin" : ""}
            strokeWidth={1.5}
          />
        </button>
      )}
    </div>
  );
}
export default memo(ChatActionButtons);
