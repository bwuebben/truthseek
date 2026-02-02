'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ReputationJourneyResponse } from '@/lib/api';

interface ReputationJourneyProps {
  journey: ReputationJourneyResponse | null;
  isLoading: boolean;
}

export function ReputationJourney({ journey, isLoading }: ReputationJourneyProps) {
  const data = journey?.history.map((point) => ({
    ...point,
    date: parseISO(point.date),
  })) || [];

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium text-text-muted mb-4">Reputation Journey</h3>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium text-text-muted mb-4">Reputation Journey</h3>
        <div className="h-[200px] flex items-center justify-center text-text-muted">
          No reputation history yet
        </div>
      </div>
    );
  }

  const formatReason = (reason: string) => {
    return reason
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted">Reputation Journey</h3>
        {journey && (
          <span className="text-lg font-bold text-text-primary">
            {journey.current_score.toFixed(1)} points
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="reputationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'MMM d')}
            tick={{ fontSize: 11, fill: '#5a6480' }}
            stroke="#5a6480"
          />

          <YAxis
            tick={{ fontSize: 11, fill: '#5a6480' }}
            stroke="#5a6480"
            width={40}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-dark-700 border border-subtle rounded-lg shadow-lg p-3">
                  <p className="text-sm text-text-muted">
                    {format(data.date, 'MMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-lg font-semibold text-text-primary">
                    {data.reputation_score.toFixed(1)} points
                  </p>
                  <p
                    className={`text-sm ${
                      data.delta >= 0 ? 'text-emerald-400' : 'text-accent-coral'
                    }`}
                  >
                    {data.delta >= 0 ? '+' : ''}{data.delta.toFixed(1)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatReason(data.reason)}
                  </p>
                </div>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="reputation_score"
            stroke="#ff4d4d"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: '#ff4d4d',
              stroke: '#0a0f1a',
              strokeWidth: 2,
            }}
            fill="url(#reputationGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
