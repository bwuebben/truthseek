'use client';

import { useState } from 'react';
import { useDiscoverStore } from '@/stores/discoverStore';
import { useAuthStore } from '@/stores/authStore';
import clsx from 'clsx';

interface FollowClaimButtonProps {
  claimId: string;
  initialFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FollowClaimButton({
  claimId,
  initialFollowing = false,
  size = 'md',
  showLabel = false,
}: FollowClaimButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { followedClaimIds, toggleFollow } = useDiscoverStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState(initialFollowing);

  const isFollowing = followedClaimIds.has(claimId) || localFollowing;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const newState = await toggleFollow(claimId);
      setLocalFollowing(newState);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
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
        isFollowing
          ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        isLoading && 'opacity-50 cursor-wait'
      )}
      title={isFollowing ? 'Unfollow' : 'Follow for updates'}
    >
      <svg
        className={iconSizes[size]}
        fill={isFollowing ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {isFollowing ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        )}
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {isFollowing ? 'Following' : 'Follow'}
        </span>
      )}
    </button>
  );
}
