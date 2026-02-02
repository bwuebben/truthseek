'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = false,
  highlightLines = []
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.trim().split('\n');

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden border border-subtle">
      {/* Header */}
      {filename && (
        <div className="bg-dark-800 px-4 py-2 text-xs text-text-muted font-mono flex items-center justify-between border-b border-subtle">
          <span>{filename}</span>
          <span className="uppercase">{language}</span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded bg-dark-600 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-500 hover:text-text-secondary"
        title="Copy code"
      >
        {copied ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* Code */}
      <pre className={clsx(
        'bg-dark-900 text-text-primary p-4 overflow-x-auto text-sm font-mono',
        filename ? '' : 'rounded-lg'
      )}>
        <code>
          {lines.map((line, i) => (
            <div
              key={i}
              className={clsx(
                'leading-relaxed',
                highlightLines.includes(i + 1) && 'bg-accent-coral/10 -mx-4 px-4'
              )}
            >
              {showLineNumbers && (
                <span className="inline-block w-8 text-text-muted select-none text-right mr-4">
                  {i + 1}
                </span>
              )}
              {line || ' '}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
