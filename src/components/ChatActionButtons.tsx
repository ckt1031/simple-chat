import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, PencilLine, RefreshCcw, Trash } from "lucide-react";
import { useConversationStore } from "@/lib/stores/conversation";
import { useGlobalStore } from "@/lib/stores/global";
import { cn } from "@/lib/utils";
import isMobile from "@/lib/is-mobile";

interface ChatActionButtonsProps {
  isRegenerating?: boolean;

  messageId: string;
  conversationId: string;

  handleRegenerate: () => void;
  onEdit?: () => void;
}

function ChatActionButtons({
  conversationId,
  handleRegenerate,
  isRegenerating = false,
  messageId,
  onEdit,
}: ChatActionButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLastMessage = useConversationStore((s) => s.isLastMessage);
  const deleteMessage = useConversationStore((s) => s.deleteMessage);
  const openDeleteConfirmation = useGlobalStore(
    (s) => s.openDeleteConfirmation,
  );

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
      () => deleteMessage(conversationId, messageId),
    );
  };

  const [copied, setCopied] = useState(false);

  const handleCopyInternal = async () => {
    try {
      const state = useConversationStore.getState();
      const conversation = state.conversations.find(
        (c) => c.id === conversationId,
      );
      const message = conversation?.messages.find((m) => m.id === messageId);
      if (!message) return;
      const textToCopy = message.reasoning
        ? `Reasoning:\n${message.reasoning}\n\nResponse:\n${message.content}`
        : message.content;
      await navigator.clipboard.writeText(textToCopy);
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
        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        title="Delete message"
      >
        <Trash size={16} strokeWidth={1.5} />
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          title="Edit message"
        >
          <PencilLine size={16} strokeWidth={1.5} />
        </button>
      )}
      <button
        onClick={handleCopyInternal}
        className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        title={copied ? "Copied!" : "Copy message"}
      >
        {copied ? (
          <Check size={16} strokeWidth={1.5} />
        ) : (
          <Copy size={16} strokeWidth={1.5} />
        )}
      </button>
      {isLastMessage(conversationId, messageId) && (
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className={cn(
            "transition-colors",
            isRegenerating
              ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
          )}
          title={isRegenerating ? "Regenerating..." : "Regenerate response"}
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
