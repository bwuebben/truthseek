'use client';

import clsx from 'clsx';

interface LeaderboardFiltersProps {
  period: 'all_time' | 'monthly' | 'weekly';
  onPeriodChange: (period: 'all_time' | 'monthly' | 'weekly') => void;
}

const periods = [
  { value: 'all_time' as const, label: 'All Time' },
  { value: 'monthly' as const, label: 'This Month' },
  { value: 'weekly' as const, label: 'This Week' },
];

export function LeaderboardFilters({
  period,
  onPeriodChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            period === p.value
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
