'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Claim } from '@/lib/api';
import { GradientDisplay, GradientCircle } from './GradientDisplay';
import { VoteButtons } from './VoteButtons';
import { BookmarkButton } from '@/components/discovery/BookmarkButton';
import clsx from 'clsx';

interface ClaimCardProps {
  claim: Claim;
  showVoting?: boolean;
  showBookmark?: boolean;
}

export function ClaimCard({ claim, showVoting = true, showBookmark = true }: ClaimCardProps) {
  const complexityColors = {
    simple: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    moderate: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    complex: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    contested: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
  };

  return (
    <div className="card hover-lift hover:border-dark-500">
      <div className="flex gap-4">
        {/* Gradient indicator */}
        <div className="flex-shrink-0">
          <GradientCircle value={claim.gradient} size={56} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/claims/${claim.id}`}>
              <h3 className="text-lg font-medium text-white hover:text-accent-cyan transition-colors line-clamp-2">
                {claim.statement}
              </h3>
            </Link>
            {showBookmark && (
              <BookmarkButton claimId={claim.id} size="sm" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <Link
              href={`/agents/${claim.author.id}`}
              className="hover:text-accent-cyan transition-colors"
            >
              @{claim.author.username}
            </Link>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(claim.created_at), {
                addSuffix: true,
              })}
            </span>
            <span>·</span>
            <span>{claim.vote_count} votes</span>
            <span>·</span>
            <span>{claim.evidence_count} evidence</span>
          </div>

          {/* Tags and complexity */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className={clsx(
                'tag capitalize border',
                complexityColors[claim.complexity_tier]
              )}
            >
              {claim.complexity_tier}
            </span>

            {claim.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/topics/${encodeURIComponent(tag)}`}
                className="tag hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors"
              >
                {tag}
              </Link>
            ))}

            {claim.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{claim.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Voting */}
        {showVoting && (
          <div className="flex-shrink-0">
            <VoteButtons claimId={claim.id} currentVote={claim.user_vote} />
          </div>
        )}
      </div>
    </div>
  );
}
