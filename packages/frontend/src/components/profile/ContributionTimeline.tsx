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
        <h3 className="text-sm font-medium text-text-muted">Contribution Timeline</h3>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={clsx(
                'px-3 py-1 text-xs rounded-full transition-colors border',
                period === p
                  ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                  : 'text-text-muted hover:bg-dark-700 border-transparent'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-text-muted">
          No activity in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEvidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5cc" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00e5cc" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(date, period === '7d' ? 'EEE' : 'MMM d')}
              tick={{ fontSize: 11, fill: '#5a6480' }}
              stroke="#5a6480"
              interval={period === '7d' ? 0 : 'preserveStartEnd'}
            />

            <YAxis
              tick={{ fontSize: 11, fill: '#5a6480' }}
              stroke="#5a6480"
              width={30}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-dark-700 border border-subtle rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-text-primary mb-2">
                      {format(data.date, 'MMM d, yyyy')}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-accent-coral">{data.votes} votes</p>
                      <p className="text-emerald-400">{data.evidence} evidence</p>
                      <p className="text-accent-cyan">{data.claims} claims</p>
                      <p className="text-amber-400">{data.comments} comments</p>
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="votes"
              stackId="1"
              stroke="#ff4d4d"
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
              stroke="#00e5cc"
              fill="url(#colorClaims)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-coral" />
          <span className="text-text-muted">Votes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-text-muted">Evidence</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent-cyan" />
          <span className="text-text-muted">Claims</span>
        </div>
      </div>
    </div>
  );
}
