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
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
    sizeClasses[size],
    active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <span>{tag}</span>
        {count !== undefined && (
          <span className={active ? 'text-blue-200' : 'text-gray-400'}>
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
        <span className={active ? 'text-blue-200' : 'text-gray-400'}>
          {count}
        </span>
      )}
    </Link>
  );
}
