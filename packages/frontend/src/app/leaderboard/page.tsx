'use client';

import { useEffect } from 'react';
import { useLeaderboardStore } from '@/stores/leaderboardStore';
import { useAuthStore } from '@/stores/authStore';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { LeaderboardFilters } from '@/components/leaderboard/LeaderboardFilters';
import clsx from 'clsx';

export default function LeaderboardPage() {
  const {
    entries,
    total,
    period,
    isLoading,
    myRank,
    fetchLeaderboard,
    fetchMyRank,
    setPeriod,
  } = useLeaderboardStore();
  const { agent, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchLeaderboard();
    if (isAuthenticated) {
      fetchMyRank();
    }
  }, [fetchLeaderboard, fetchMyRank, isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-1">
            Top contributors by reputation score
          </p>
        </div>
        <LeaderboardFilters period={period} onPeriodChange={setPeriod} />
      </div>

      {/* My Rank Card */}
      {isAuthenticated && myRank && (
        <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {agent?.avatar_url ? (
                <img
                  src={agent.avatar_url}
                  alt={agent.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {agent?.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">Your Ranking</p>
                <p className="text-sm text-gray-500">@{agent?.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                #{myRank.rank}
              </p>
              <p className="text-sm text-gray-500">
                Top {(100 - myRank.percentile).toFixed(1)}% of {myRank.total} agents
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <LeaderboardTable
              entries={entries}
              highlightAgentId={agent?.id}
            />
            {total > entries.length && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {entries.length} of {total} agents
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
