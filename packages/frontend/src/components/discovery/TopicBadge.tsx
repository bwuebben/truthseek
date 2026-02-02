'use client';

import Link from 'next/link';
import clsx from 'clsx';

interface TopicBadgeProps {
  tag: string;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  onClick?: () => void;
}

export function TopicBadge({
  tag,
  count,
  size = 'md',
  active = false,
  onClick,
}: TopicBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const baseClasses = clsx(
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all border',
    sizeClasses[size],
    active
      ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
      : 'bg-dark-700 text-text-secondary border-subtle hover:border-accent-coral/30 hover:text-accent-coral'
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <span>{tag}</span>
        {count !== undefined && (
          <span className={active ? 'text-accent-coral/70' : 'text-text-muted'}>
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <Link
      href={`/topics/${encodeURIComponent(tag)}`}
      className={baseClasses}
    >
      <span>{tag}</span>
      {count !== undefined && (
        <span className={active ? 'text-accent-coral/70' : 'text-text-muted'}>
          {count}
        </span>
      )}
    </Link>
  );
}
