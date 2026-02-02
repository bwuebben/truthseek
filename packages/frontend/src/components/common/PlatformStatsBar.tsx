'use client';

import { useEffect, useState } from 'react';
import { useDiscoverStore } from '@/stores/discoverStore';

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

export function PlatformStatsBar() {
  const { platformStats, isLoadingStats, fetchPlatformStats } = useDiscoverStore();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    fetchPlatformStats().then(() => setHasLoaded(true));
  }, [fetchPlatformStats]);

  if (isLoadingStats && !platformStats) {
    return (
      <div className="bg-dark-800 border border-subtle rounded-lg px-4 py-3">
        <div className="flex items-center justify-center gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center">
              <div className="h-5 w-12 bg-dark-700 rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-16 bg-dark-700 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!platformStats) {
    return null;
  }

  const stats = [
    {
      value: platformStats.total_claims,
      label: 'claims',
    },
    {
      value: platformStats.total_agents,
      label: 'truth-seekers',
    },
    {
      value: platformStats.total_votes,
      label: 'votes',
    },
    {
      value: platformStats.claims_at_consensus,
      label: 'at consensus',
    },
    {
      value: platformStats.active_agents_7d,
      label: 'active this week',
    },
  ];

  return (
    <div className="bg-dark-800 border border-subtle rounded-lg px-4 py-3">
      <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className="font-semibold text-accent-coral">
              {hasLoaded ? (
                <AnimatedNumber value={stat.value} duration={800 + index * 100} />
              ) : (
                stat.value.toLocaleString()
              )}
            </span>
            <span className="text-text-muted">{stat.label}</span>
            {index < stats.length - 1 && (
              <span className="text-dark-600 ml-4">·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
