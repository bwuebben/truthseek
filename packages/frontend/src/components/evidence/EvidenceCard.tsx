'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Evidence, api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import clsx from 'clsx';

interface EvidenceCardProps {
  evidence: Evidence;
  onVote?: () => void;
}

export function EvidenceCard({ evidence, onVote }: EvidenceCardProps) {
  const { isAuthenticated } = useAuthStore();
  const [isVoting, setIsVoting] = useState(false);
  const [currentVote, setCurrentVote] = useState(evidence.user_vote);
  const [voteScore, setVoteScore] = useState(evidence.vote_score);

  const handleVote = async (direction: 'up' | 'down') => {
    if (!isAuthenticated || isVoting) return;

    setIsVoting(true);
    try {
      if (currentVote === direction) {
        // Remove vote
        await api.removeEvidenceVote(evidence.id);
        setCurrentVote(null);
        setVoteScore(voteScore + (direction === 'up' ? -1 : 1));
      } else {
        // Add or change vote
        await api.voteOnEvidence(evidence.id, direction);
        const scoreDelta = direction === 'up' ? 1 : -1;
        const previousDelta = currentVote === 'up' ? -1 : currentVote === 'down' ? 1 : 0;
        setVoteScore(voteScore + scoreDelta + previousDelta);
        setCurrentVote(direction);
      }
      onVote?.();
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const positionColors = {
    supports: 'border-l-green-500 bg-green-50',
    opposes: 'border-l-red-500 bg-red-50',
    neutral: 'border-l-gray-400 bg-gray-50',
  };

  const positionBadgeColors = {
    supports: 'bg-green-100 text-green-700',
    opposes: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-700',
  };

  return (
    <div
      className={clsx(
        'border-l-4 rounded-lg p-4',
        positionColors[evidence.position]
      )}
    >
      <div className="flex gap-4">
        {/* Voting */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleVote('up')}
            disabled={!isAuthenticated || isVoting}
            className={clsx(
              'p-1 rounded transition-colors',
              currentVote === 'up'
                ? 'text-green-600'
                : 'text-gray-400 hover:text-green-600'
            )}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <span
            className={clsx(
              'text-sm font-medium',
              voteScore > 0
                ? 'text-green-600'
                : voteScore < 0
                ? 'text-red-600'
                : 'text-gray-500'
            )}
          >
            {voteScore}
          </span>

          <button
            onClick={() => handleVote('down')}
            disabled={!isAuthenticated || isVoting}
            className={clsx(
              'p-1 rounded transition-colors',
              currentVote === 'down'
                ? 'text-red-600'
                : 'text-gray-400 hover:text-red-600'
            )}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={clsx(
                'tag capitalize',
                positionBadgeColors[evidence.position]
              )}
            >
              {evidence.position}
            </span>
            <span className="tag bg-gray-100 text-gray-600 capitalize">
              {evidence.content_type}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700">
            {evidence.content_type === 'link' ? (
              <a
                href={evidence.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {evidence.content}
              </a>
            ) : evidence.content_type === 'code' ? (
              <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto">
                <code>{evidence.content}</code>
              </pre>
            ) : (
              <p className="whitespace-pre-wrap">{evidence.content}</p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
            <Link
              href={`/agents/${evidence.author.id}`}
              className="hover:text-blue-600"
            >
              @{evidence.author.username}
            </Link>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(evidence.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
