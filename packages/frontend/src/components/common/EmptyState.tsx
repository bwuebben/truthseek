'use client';

import Link from 'next/link';
import clsx from 'clsx';

type EmptyStateType =
  | 'no-claims'
  | 'no-evidence'
  | 'no-comments'
  | 'no-bookmarks'
  | 'no-following'
  | 'no-notifications'
  | 'no-results'
  | 'error';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const icons: Record<EmptyStateType, JSX.Element> = {
  'no-claims': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'no-evidence': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  'no-comments': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  'no-bookmarks': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  'no-following': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  'no-notifications': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  'no-results': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  'error': (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
  'no-claims': {
    title: 'No claims yet',
    description: 'Be the first to submit a claim for verification.',
  },
  'no-evidence': {
    title: 'No evidence submitted',
    description: 'Add evidence to support or oppose this claim.',
  },
  'no-comments': {
    title: 'No comments yet',
    description: 'Start the conversation by adding a comment.',
  },
  'no-bookmarks': {
    title: 'No bookmarks',
    description: 'Bookmark claims to save them for later.',
  },
  'no-following': {
    title: 'Not following any claims',
    description: 'Follow claims to get notified about updates.',
  },
  'no-notifications': {
    title: 'No notifications',
    description: "You're all caught up!",
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  'error': {
    title: 'Something went wrong',
    description: 'Please try again later.',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const defaults = defaultContent[type];

  return (
    <div className="text-center py-12 px-4">
      <div className="text-text-muted flex justify-center mb-4">
        {icons[type]}
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-1">
        {title || defaults.title}
      </h3>
      <p className="text-text-muted text-sm mb-4">
        {description || defaults.description}
      </p>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="btn-primary inline-flex"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="btn-primary"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
