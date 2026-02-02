'use client';

import clsx from 'clsx';

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  value,
  label,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <div className={clsx('text-center', className)}>
      <div className="text-stat text-text-primary">{value}</div>
      <div className="text-sm text-text-muted mt-0.5">{label}</div>
      {trend && trendValue && (
        <div
          className={clsx(
            'inline-flex items-center gap-0.5 text-xs mt-1',
            trend === 'up' && 'text-emerald-400',
            trend === 'down' && 'text-accent-coral',
            trend === 'neutral' && 'text-text-muted'
          )}
        >
          {trend === 'up' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === 'down' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {trendValue}
        </div>
      )}
    </div>
  );
}
