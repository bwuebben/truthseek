'use client';

import { ExpertiseArea } from '@/lib/api';
import clsx from 'clsx';
import Link from 'next/link';

interface ExpertiseTagsProps {
  expertise: ExpertiseArea[];
}

const getAccuracyColor = (accuracy: number | null) => {
  if (accuracy === null) return 'bg-dark-600 text-text-secondary border border-subtle';
  if (accuracy >= 75) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
  if (accuracy >= 50) return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
  return 'bg-accent-coral/10 text-accent-coral border border-accent-coral/30';
};

export function ExpertiseTags({ expertise }: ExpertiseTagsProps) {
  if (expertise.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium text-text-muted mb-3">Expertise Areas</h3>
        <p className="text-text-muted text-sm">
          No expertise areas yet. Vote on claims to build your expertise.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-muted mb-3">Expertise Areas</h3>
      <div className="flex flex-wrap gap-2">
        {expertise.map((area) => (
          <Link
            key={area.tag}
            href={`/topics/${encodeURIComponent(area.tag)}`}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105',
              getAccuracyColor(area.accuracy)
            )}
          >
            <span>{area.tag}</span>
            {area.accuracy !== null && (
              <span className="text-xs opacity-75">{area.accuracy}%</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
