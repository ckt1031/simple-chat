import { useMemo, useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

const MAX_LINES_BEFORE_COLLAPSE = 20;

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { shouldShowExpand, hiddenLines } = useMemo(() => {
    // Get the code content as string
    const codeContent =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.join("")
          : "";

    // Count lines to determine if we should show expand/collapse
    const lines = codeContent.split("\n");
    return {
      shouldShowExpand: lines.length > MAX_LINES_BEFORE_COLLAPSE,
      hiddenLines: lines.length - MAX_LINES_BEFORE_COLLAPSE,
    };
  }, [children]);

  return (
    <div className="relative group">
      {/* Code content */}
      <pre
        className={cn(
          className,
          isExpanded ? "max-h-full" : "max-h-[200px]",
          "m-0 rounded-b-lg",
        )}
      >
        <code className="block m-2 whitespace-pre-wrap">{children}</code>
      </pre>

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
