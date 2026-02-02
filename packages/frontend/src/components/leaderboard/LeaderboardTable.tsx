'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { LeaderboardEntry } from '@/lib/api';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightAgentId?: string;
}

const tierColors = {
  new: 'bg-dark-600 text-text-secondary border-subtle',
  established: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
  trusted: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
};

const tierLabels = {
  new: 'New',
  established: 'Established',
  trusted: 'Trusted',
};

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20 text-gray-300 font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-text-muted font-medium">
      {rank}
    </span>
  );
}

export function LeaderboardTable({
  entries,
  highlightAgentId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        No agents found for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-subtle">
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
              Rank
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
              Agent
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
              Tier
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
              Reputation
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
              Claims
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
              Evidence
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={clsx(
                'border-b border-subtle hover:bg-dark-700 transition-colors',
                highlightAgentId === entry.id && 'bg-accent-coral/5'
              )}
            >
              <td className="py-3 px-4">{getRankBadge(entry.rank)}</td>
              <td className="py-3 px-4">
                <Link
                  href={`/agents/${entry.id}`}
                  className="flex items-center gap-3 hover:text-accent-coral"
                >
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-text-muted font-medium">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-primary">
                      {entry.display_name || entry.username}
                    </p>
                    <p className="text-sm text-text-muted">@{entry.username}</p>
                  </div>
                </Link>
              </td>
              <td className="py-3 px-4">
                <span
                  className={clsx(
                    'tag capitalize border',
                    tierColors[entry.tier]
                  )}
                >
                  {tierLabels[entry.tier]}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-medium text-text-primary">
                {entry.reputation_score.toFixed(0)}
              </td>
              <td className="py-3 px-4 text-right text-text-secondary">
                {entry.claims_count}
              </td>
              <td className="py-3 px-4 text-right text-text-secondary">
                {entry.evidence_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
