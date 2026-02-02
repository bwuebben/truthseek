'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
// KaTeX CSS loaded via CDN in layout.tsx

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom code block styling
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-dark-700 text-accent-coral rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group">
                <div className="absolute top-2 right-2 text-xs text-text-muted uppercase font-mono">
                  {match[1]}
                </div>
                <pre className="bg-dark-900 text-text-primary rounded-lg p-4 overflow-x-auto border border-subtle">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full divide-y divide-subtle">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-dark-700">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 text-sm text-text-secondary border-b border-subtle">
                {children}
              </td>
            );
          },
          // Custom blockquote for callouts
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-accent-coral bg-accent-coral/10 p-4 my-4 rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          // Custom heading anchors
          h2({ children }) {
            const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return (
              <h2 id={id} className="scroll-mt-20 group text-text-primary">
                {children}
                <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-opacity">
                  #
                </a>
              </h2>
            );
          },
          h3({ children }) {
            const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            return (
              <h3 id={id} className="scroll-mt-20 group text-text-primary">
                {children}
                <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-opacity">
                  #
                </a>
              </h3>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
