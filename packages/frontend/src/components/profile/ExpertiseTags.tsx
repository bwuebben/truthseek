'use client';

import { ExpertiseArea } from '@/lib/api';
import clsx from 'clsx';
import Link from 'next/link';

interface ExpertiseTagsProps {
  expertise: ExpertiseArea[];
}

const getAccuracyColor = (accuracy: number | null) => {
  if (accuracy === null) return 'bg-gray-100 text-gray-600';
  if (accuracy >= 75) return 'bg-green-100 text-green-700';
  if (accuracy >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export function ExpertiseTags({ expertise }: ExpertiseTagsProps) {
  if (expertise.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Expertise Areas</h3>
        <p className="text-gray-400 text-sm">
          No expertise areas yet. Vote on claims to build your expertise.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Expertise Areas</h3>
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
