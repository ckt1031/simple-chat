import { marked } from "marked";
import { memo, Suspense, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import dynamic from "next/dynamic";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const CodeBlock = dynamic(() => import("./Markdown/Codeblock"));

interface MemoizedMarkdownBlockProps {
  content: string;
  isStreaming?: boolean;
}

const MemoizedMarkdownBlock = memo(
  ({ content, isStreaming }: MemoizedMarkdownBlockProps) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
        components={{
          br: ({ ...props }) => <br {...props} />,
          table: ({ ...props }) => (
            <div className="overflow-x-auto w-full">
              <table className="table-auto min-w-xl" {...props} />
            </div>
          ),
          pre: ({ children, ...props }) => {
            const codeElement = children as React.ReactElement<{
              className?: string;
              children?: React.ReactNode;
            }>;
            if (codeElement?.type === "code") {
              return (
                <Suspense fallback={<div>Loading code block...</div>}>
                  <CodeBlock
                    className={codeElement.props.className}
                    isStreaming={isStreaming}
                  >
                    {codeElement.props.children}
                  </CodeBlock>
                </Suspense>
              );
            }
            return <pre {...props}>{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming,
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({
    content,
    id,
    isStreaming,
  }: {
    content: string;
    id: string;
    isStreaming?: boolean;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        content={block}
        isStreaming={isStreaming}
        key={`${id}-block_${index}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
