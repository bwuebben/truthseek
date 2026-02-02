'use client';

// KaTeX CSS loaded via CDN in layout.tsx
import katex from 'katex';
import { useMemo } from 'react';

interface FormulaProps {
  math: string;
  display?: boolean;
  className?: string;
}

export function Formula({ math, display = false, className = '' }: FormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      console.error('KaTeX error:', e);
      return math;
    }
  }, [math, display]);

  if (display) {
    return (
      <div
        className={`my-6 py-4 px-6 bg-dark-700 rounded-lg border border-subtle overflow-x-auto ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
