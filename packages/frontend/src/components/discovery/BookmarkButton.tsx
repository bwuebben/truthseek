'use client';

import { useState } from 'react';
import { useDiscoverStore } from '@/stores/discoverStore';
import { useAuthStore } from '@/stores/authStore';
import clsx from 'clsx';

interface BookmarkButtonProps {
  claimId: string;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function BookmarkButton({
  claimId,
  initialBookmarked = false,
  size = 'md',
  showLabel = false,
}: BookmarkButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { bookmarkedClaimIds, toggleBookmark } = useDiscoverStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(initialBookmarked);

  const isBookmarked = bookmarkedClaimIds.has(claimId) || localBookmarked;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const newState = await toggleBookmark(claimId);
      setLocalBookmarked(newState);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={clsx(
        'rounded-lg transition-all flex items-center gap-1.5',
        sizeClasses[size],
        isBookmarked
          ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        isLoading && 'opacity-50 cursor-wait'
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      <svg
        className={iconSizes[size]}
        fill={isBookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isBookmarked ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  );
}
