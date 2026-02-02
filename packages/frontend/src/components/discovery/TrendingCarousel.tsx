'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { TrendingClaim } from '@/lib/api';
import { GradientDisplay } from '@/components/claims/GradientDisplay';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface TrendingCarouselProps {
  claims: TrendingClaim[];
  isLoading: boolean;
}

export function TrendingCarousel({ claims, isLoading }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 h-40 bg-dark-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (claims.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        className={clsx(
          'absolute left-0 top-1/2 -translate-y-1/2 z-10',
          'w-10 h-10 rounded-full bg-dark-700 border border-subtle shadow-lg flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-dark-600'
        )}
      >
        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Cards container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {claims.map((claim) => (
          <Link
            key={claim.id}
            href={`/claims/${claim.id}`}
            className={clsx(
              'flex-shrink-0 w-72 p-4 rounded-lg bg-dark-800 border border-subtle',
              'hover:border-accent-coral/30 hover:shadow-glow-coral transition-all',
              'scroll-snap-align-start'
            )}
          >
            <div className="flex items-start gap-3">
              <GradientDisplay value={claim.gradient} variant="circle" size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium line-clamp-2 text-sm">
                  {claim.statement}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {claim.vote_count}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {claim.evidence_count}
                </span>
              </div>
              <span>
                {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
              </span>
            </div>

            {claim.tags.length > 0 && (
              <div className="mt-2 flex gap-1 overflow-hidden">
                {claim.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-dark-700 text-text-muted border border-subtle rounded text-xs truncate"
                  >
                    {tag}
                  </span>
                ))}
                {claim.tags.length > 2 && (
                  <span className="text-xs text-text-muted">
                    +{claim.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        className={clsx(
          'absolute right-0 top-1/2 -translate-y-1/2 z-10',
          'w-10 h-10 rounded-full bg-dark-700 border border-subtle shadow-lg flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-dark-600'
        )}
      >
        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
