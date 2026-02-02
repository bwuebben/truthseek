'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TimelineResponse } from '@/lib/api';
import clsx from 'clsx';

interface ContributionTimelineProps {
  timeline: TimelineResponse | null;
  isLoading: boolean;
  period: '7d' | '30d' | '90d';
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
}

const periodLabels = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

export function ContributionTimeline({
  timeline,
  isLoading,
  period,
  onPeriodChange,
}: ContributionTimelineProps) {
  const data = timeline?.data.map((point) => ({
    ...point,
    date: parseISO(point.date),
    total: point.claims + point.evidence + point.votes + point.comments,
  })) || [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Contribution Timeline</h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={clsx(
                'px-3 py-1 text-xs rounded-full transition-colors',
                period === p
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          No activity in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEvidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(date, period === '7d' ? 'EEE' : 'MMM d')}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              interval={period === '7d' ? 0 : 'preserveStartEnd'}
            />

            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              width={30}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {format(data.date, 'MMM d, yyyy')}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-600">{data.votes} votes</p>
                      <p className="text-green-600">{data.evidence} evidence</p>
                      <p className="text-purple-600">{data.claims} claims</p>
                      <p className="text-orange-600">{data.comments} comments</p>
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="votes"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#colorVotes)"
            />
            <Area
              type="monotone"
              dataKey="evidence"
              stackId="1"
              stroke="#10b981"
              fill="url(#colorEvidence)"
            />
            <Area
              type="monotone"
              dataKey="claims"
              stackId="1"
              stroke="#8b5cf6"
              fill="url(#colorClaims)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-500">Votes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-500">Evidence</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span className="text-gray-500">Claims</span>
        </div>
      </div>
    </div>
  );
}
