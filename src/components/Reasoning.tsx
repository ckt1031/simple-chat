import { ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MemoizedMarkdown } from "./MemoizedMarkdown";

interface ReasoningProps {
  reasoning: string;
  reasoningStartTime?: number;
  reasoningEndTime?: number;
}

export default function Reasoning({
  reasoning,
  reasoningStartTime,
  reasoningEndTime,
}: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!reasoningStartTime) return;

    const update = () => {
      const end = reasoningEndTime ?? Date.now();
      const seconds = Math.max(
        0,
        Math.floor((end - reasoningStartTime) / 1000),
      );
      setElapsedSeconds(seconds);
    };

    update();

    if (reasoningEndTime == null) {
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [reasoningStartTime, reasoningEndTime]);

  const getTimeText = (seconds: number) => {
    if (seconds === 1) return "1 second";
    return `${seconds} seconds`;
  };

  return (
    <div className="mb-4">
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      >
        <span>
          {reasoningStartTime
            ? `Reasoned for ${getTimeText(elapsedSeconds)}`
            : "Reasoned"}
        </span>
        <ChevronRightIcon
          className={`w-3 h-3 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </button>
      {isExpanded && (
        <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap border-l-4 border-neutral-200 dark:border-neutral-800 pl-2">
          <MemoizedMarkdown content={reasoning} id="reasoning" />
        </div>
      )}
    </div>
  );
}
