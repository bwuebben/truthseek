'use client';

import clsx from 'clsx';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-accent-coral/30 bg-accent-coral/10 p-4',
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-accent-coral"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-accent-coral">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-accent-coral hover:text-accent-coral-hover underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotFoundProps {
  resource?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function NotFound({
  resource = 'Page',
  message,
  backHref = '/',
  backLabel = 'Go Home',
}: NotFoundProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-dark-600">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">
          {resource} not found
        </h2>
        <p className="mt-2 text-text-muted">
          {message || `The ${resource.toLowerCase()} you're looking for doesn't exist.`}
        </p>
        <a href={backHref} className="btn-primary mt-6 inline-block">
          {backLabel}
        </a>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-muted">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4">
          {action.label}
        </button>
      )}
    </div>
  );
}
