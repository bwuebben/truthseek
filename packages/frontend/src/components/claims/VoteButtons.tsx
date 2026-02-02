'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useClaimsStore } from '@/stores/claimsStore';
import clsx from 'clsx';

interface VoteButtonsProps {
  claimId: string;
  currentVote: number | null;
}

export function VoteButtons({ claimId, currentVote }: VoteButtonsProps) {
  const { isAuthenticated } = useAuthStore();
  const { voteOnClaim, removeVote } = useClaimsStore();
  const [isVoting, setIsVoting] = useState(false);
  const [animatingButton, setAnimatingButton] = useState<number | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleVote = async (value: number, index: number) => {
    if (!isAuthenticated || isVoting) return;

    setIsVoting(true);
    setAnimatingButton(value);

    try {
      if (currentVote === value) {
        await removeVote(claimId);
      } else {
        await voteOnClaim(claimId, value);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
      // Keep animation for a moment after vote completes
      setTimeout(() => setAnimatingButton(null), 200);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-xs text-gray-400 text-center">
        Sign in to vote
      </div>
    );
  }

  const buttons = [
    { value: 1, label: 'True', activeColor: 'bg-green-500', hoverColor: 'hover:bg-green-100 hover:text-green-700' },
    { value: 0.5, label: 'Unsure', activeColor: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-100 hover:text-yellow-700' },
    { value: 0, label: 'False', activeColor: 'bg-red-500', hoverColor: 'hover:bg-red-100 hover:text-red-700' },
  ];

  return (
    <div className="flex flex-col gap-1">
      {buttons.map((btn, index) => (
        <button
          key={btn.value}
          ref={(el) => { buttonRefs.current[index] = el; }}
          onClick={() => handleVote(btn.value, index)}
          disabled={isVoting}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            currentVote === btn.value
              ? `${btn.activeColor} text-white shadow-md`
              : `bg-gray-100 text-gray-600 ${btn.hoverColor}`,
            animatingButton === btn.value && 'animate-vote-pulse',
            isVoting && 'opacity-70 cursor-wait'
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
