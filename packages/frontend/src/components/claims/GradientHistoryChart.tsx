'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { GradientHistoryEntry } from '@/lib/api';

interface GradientHistoryChartProps {
  history: GradientHistoryEntry[];
  className?: string;
}

export function GradientHistoryChart({
  history,
  className,
}: GradientHistoryChartProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No gradient history yet
      </div>
    );
  }

  const data = [...history]
    .reverse()
    .map((entry) => ({
      ...entry,
      date: new Date(entry.recorded_at),
      gradientPercent: entry.gradient * 100,
    }));

  const getGradientColor = (value: number) => {
    if (value < 30) return '#ff4d4d';
    if (value > 70) return '#10b981';
    return '#f59e0b';
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(date, 'MMM d')}
            tick={{ fontSize: 12, fill: '#5a6480' }}
            stroke="#5a6480"
          />

          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12, fill: '#5a6480' }}
            stroke="#5a6480"
            width={45}
          />

          {/* Reference lines for truth thresholds */}
          <ReferenceLine
            y={30}
            stroke="#ff4d4d"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={70}
            stroke="#10b981"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={50}
            stroke="#5a6480"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
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
                  <p
                    className="text-lg font-semibold"
                    style={{ color: getGradientColor(data.gradientPercent) }}
                  >
                    {data.gradientPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-text-muted">
                    {data.vote_count} votes
                  </p>
                </div>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="gradientPercent"
            stroke="#ff4d4d"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: '#ff4d4d',
              stroke: '#0a0f1a',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-emerald-500" />
          <span className="text-text-muted">Likely True (&gt;70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500" />
          <span className="text-text-muted">Uncertain (30-70%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-accent-coral" />
          <span className="text-text-muted">Likely False (&lt;30%)</span>
        </div>
      </div>
    </div>
  );
}
