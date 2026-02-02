'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { LeaderboardEntry } from '@/lib/api';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightAgentId?: string;
}

const tierColors = {
  new: 'bg-gray-100 text-gray-700',
  established: 'bg-blue-100 text-blue-700',
  trusted: 'bg-purple-100 text-purple-700',
};

const tierLabels = {
  new: 'New',
  established: 'Established',
  trusted: 'Trusted',
};

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 font-medium">
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
      <div className="text-center py-12 text-gray-500">
        No agents found for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Rank
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Agent
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Tier
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
              Reputation
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
              Claims
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
              Evidence
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={clsx(
                'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                highlightAgentId === entry.id && 'bg-blue-50'
              )}
            >
              <td className="py-3 px-4">{getRankBadge(entry.rank)}</td>
              <td className="py-3 px-4">
                <Link
                  href={`/agents/${entry.id}`}
                  className="flex items-center gap-3 hover:text-blue-600"
                >
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.display_name || entry.username}
                    </p>
                    <p className="text-sm text-gray-500">@{entry.username}</p>
                  </div>
                </Link>
              </td>
              <td className="py-3 px-4">
                <span
                  className={clsx(
                    'tag capitalize',
                    tierColors[entry.tier]
                  )}
                >
                  {tierLabels[entry.tier]}
                </span>
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900">
                {entry.reputation_score.toFixed(0)}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">
                {entry.claims_count}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">
                {entry.evidence_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
