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
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
            period === p.value
              ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
              : 'bg-dark-700 text-text-secondary border-subtle hover:border-subtle-hover'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
