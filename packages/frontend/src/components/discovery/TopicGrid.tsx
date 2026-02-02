'use client';

import Link from 'next/link';
import { TopicInfo } from '@/lib/api';
import { TopicBadge } from './TopicBadge';

interface TopicGridProps {
  topics: TopicInfo[];
  isLoading: boolean;
  limit?: number;
  showViewAll?: boolean;
}

export function TopicGrid({
  topics,
  isLoading,
  limit,
  showViewAll = true,
}: TopicGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-8 w-20 bg-dark-700 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  const displayTopics = limit ? topics.slice(0, limit) : topics;
  const hasMore = limit && topics.length > limit;

  return (
    <div className="flex flex-wrap gap-2">
      {displayTopics.map((topic) => (
        <TopicBadge
          key={topic.tag}
          tag={topic.tag}
          count={topic.claim_count}
        />
      ))}
      {hasMore && showViewAll && (
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-accent-coral hover:text-accent-coral-hover font-medium transition-colors"
        >
          View all
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
