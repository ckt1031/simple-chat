import React, { useMemo, useState, useCallback } from "react";
import { Copy, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

const MAX_LINES_BEFORE_COLLAPSE = 20;

export default function CodeBlock({ children, className }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const extractTextContent = (node: React.ReactNode): string => {
    if (typeof node === "string") {
      return node;
    }
    if (typeof node === "number" || typeof node === "boolean") {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractTextContent).join("");
    }
    if (node && typeof node === "object" && "props" in node) {
      const element = node as React.ReactElement & {
        props: { children?: React.ReactNode };
      };
      if (element.props.children) {
        return extractTextContent(element.props.children);
      }
    }
    return "";
  };

  const { shouldShowExpand, hiddenLines } = useMemo(() => {
    // Extract text content for line counting
    const codeContent = extractTextContent(children);

    // Count lines to determine if we should show expand/collapse
    const lines = codeContent.split("\n");
    return {
      shouldShowExpand: lines.length > MAX_LINES_BEFORE_COLLAPSE,
      hiddenLines: lines.length - MAX_LINES_BEFORE_COLLAPSE,
    };
  }, [children]);

  const handleCopy = useCallback(async () => {
    const textToCopy = extractTextContent(children);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }, [children]);

  return (
    <div className="relative group">
      {/* Code content */}
      <pre
        className={cn(
          className,
          isExpanded ? "max-h-full" : "max-h-[200px]",
          "m-0 rounded-b-lg",
          // Override global prose pre background
          "!bg-neutral-800",
        )}
      >
        <code className="block m-2 whitespace-pre-wrap !bg-transparent">
          {children}
        </code>
      </pre>

      {/* Top right copy button */}
      <div className="absolute top-2 right-2 p-2">
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 p-2 text-xs rounded transition-all duration-200",
            "bg-neutral-700 text-neutral-300 hover:bg-neutral-600",
          )}
          title={isCopied ? "Copied!" : "Copy code"}
        >
          {isCopied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Expand/collapse button for long code */}
      {shouldShowExpand && (
        <div className="absolute bottom-2 right-2 p-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600 transition-colors"
            title={isExpanded ? "Collapse code" : "Expand code"}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show {hiddenLines} more lines
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
