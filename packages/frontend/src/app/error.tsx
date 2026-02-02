'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Something went wrong
        </h1>
        <p className="text-text-muted mb-8">
          We encountered an error while loading this page. This has been logged
          and we'll look into it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <a href="/" className="btn-secondary">
            Go Home
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-text-muted cursor-pointer">
              Error details (development only)
            </summary>
            <pre className="mt-2 p-4 bg-dark-700 rounded-lg text-xs overflow-auto text-text-secondary border border-subtle">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
