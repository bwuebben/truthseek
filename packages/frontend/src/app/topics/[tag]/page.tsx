'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, TrendingClaim } from '@/lib/api';
import { GradientDisplay } from '@/components/claims/GradientDisplay';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

type SortOption = 'recent' | 'gradient' | 'votes';

export default function TopicClaimsPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);

  const [claims, setClaims] = useState<TrendingClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('recent');

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      try {
        const response = await api.getTopicClaims(tag, sort, 50, 0);
        setClaims(response.claims);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to fetch topic claims:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [tag, sort]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/topics"
          className="text-sm text-accent-coral hover:text-accent-coral-hover flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Topics
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span className="px-3 py-1 bg-accent-coral/10 text-accent-coral rounded-full border border-accent-coral/30">
                {tag}
              </span>
            </h1>
            <p className="text-text-muted mt-1">
              {total} {total === 1 ? 'claim' : 'claims'}
            </p>
          </div>

          {/* Sort options */}
          <div className="flex gap-1">
            {[
              { value: 'recent', label: 'Recent' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'votes', label: 'Most Voted' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSort(option.value as SortOption)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors border',
                  sort === option.value
                    ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                    : 'text-text-muted hover:bg-dark-700 border-transparent'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
        </div>
      ) : claims.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted">No claims found for this topic</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/claims/${claim.id}`}
              className="card block hover:border-subtle-hover transition-colors"
            >
              <div className="flex items-start gap-4">
                <GradientDisplay value={claim.gradient} variant="circle" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium line-clamp-2">
                    {claim.statement}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                    <span>{claim.vote_count} votes</span>
                    <span>{claim.evidence_count} evidence</span>
                    <span>
                      {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {claim.tags.length > 1 && (
                    <div className="flex gap-1.5 mt-2">
                      {claim.tags
                        .filter((t) => t !== tag)
                        .slice(0, 3)
                        .map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-dark-600 text-text-muted rounded text-xs border border-subtle"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
