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
      <div className="text-xs text-text-muted text-center">
        Sign in to vote
      </div>
    );
  }

  const buttons = [
    { value: 1, label: 'True', activeColor: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-500/10 hover:text-emerald-400' },
    { value: 0.5, label: 'Unsure', activeColor: 'bg-amber-500', hoverColor: 'hover:bg-amber-500/10 hover:text-amber-400' },
    { value: 0, label: 'False', activeColor: 'bg-accent-coral', hoverColor: 'hover:bg-accent-coral/10 hover:text-accent-coral' },
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
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            currentVote === btn.value
              ? `${btn.activeColor} text-white shadow-md border-transparent`
              : `bg-dark-700 text-text-muted border-subtle ${btn.hoverColor}`,
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
