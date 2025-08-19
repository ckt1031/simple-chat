import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCcw, Trash } from "lucide-react";
import { useConversationStore } from "@/lib/stores/conversation";
import { cn } from "@/lib/utils";

interface ChatActionButtonsProps {
    copied: boolean;
    isRegenerating?: boolean;

    messageId: string;
    conversationId: string;

    handleCopy: () => void;
    handleRegenerate: () => void;
}

export default function ChatActionButtons({ handleCopy, copied, conversationId, handleRegenerate, isRegenerating = false, messageId }: ChatActionButtonsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { isLastMessage, deleteMessage } = useConversationStore();

    // Show the buttons when the mouse is within 60px of the container (top/bottom/left/right)
    // This is a simple "proximity" effect using mousemove on the document.
    // For more advanced/production use, consider a library or a custom hook.

    // We'll use a state to control visibility
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!containerRef.current) return;
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
        deleteMessage(conversationId, messageId);
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                'flex space-x-2 mt-1 px-2 transition-opacity duration-200',
                'font-light',
                visible ? "opacity-100" : "opacity-0"
            )}
        >
            <button
                onClick={handleDelete}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="Delete message"
            >
                <Trash size={16} strokeWidth={1.5} />
            </button>
            <button
                onClick={handleCopy}
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
                        'transition-colors',
                        isRegenerating
                            ? "text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    )}
                    title={isRegenerating ? "Regenerating..." : "Regenerate response"}
                >
                    <RefreshCcw size={16} className={isRegenerating ? "animate-spin" : ""} strokeWidth={1.5} />
                </button>
            )}
        </div>
    );
}