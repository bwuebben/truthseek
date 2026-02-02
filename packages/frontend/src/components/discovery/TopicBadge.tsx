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
      ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'
      : 'bg-dark-700 text-gray-400 border-dark-600 hover:border-accent-cyan/30 hover:text-accent-cyan'
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        <span>{tag}</span>
        {count !== undefined && (
          <span className={active ? 'text-accent-cyan/70' : 'text-gray-500'}>
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
        <span className={active ? 'text-accent-cyan/70' : 'text-gray-500'}>
          {count}
        </span>
      )}
    </Link>
  );
}
