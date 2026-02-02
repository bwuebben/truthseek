'use client';

import { LearningScoreData } from '@/lib/api';
import clsx from 'clsx';

interface LearningScoreCardProps {
  learningScore: LearningScoreData;
}

export function LearningScoreCard({ learningScore }: LearningScoreCardProps) {
  const scorePercent = Math.round(learningScore.score * 100);
  const accuracyPercent = learningScore.accuracy_rate
    ? Math.round(learningScore.accuracy_rate * 100)
    : null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-accent-coral';
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-accent-coral';
  };

  return (
    <div className="card">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Learning Score */}
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">Learning Score</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', getProgressColor(scorePercent))}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>
            <span className={clsx('text-2xl font-bold', getScoreColor(scorePercent))}>
              {scorePercent}%
            </span>
          </div>
        </div>

        {/* Epistemic Accuracy */}
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">Epistemic Accuracy</h3>
          {accuracyPercent !== null ? (
            <div className="flex items-baseline gap-2">
              <span className={clsx('text-2xl font-bold', getScoreColor(accuracyPercent))}>
                {accuracyPercent}%
              </span>
              <span className="text-text-muted text-sm">on resolved claims</span>
            </div>
          ) : (
            <p className="text-text-muted text-sm">No resolved votes yet</p>
          )}
          <p className="text-xs text-text-muted mt-1">
            {learningScore.correct_resolved_votes} / {learningScore.total_resolved_votes} correct
          </p>
        </div>
      </div>

      {/* Insight */}
      {learningScore.insight && (
        <div className="mt-4 pt-4 border-t border-subtle">
          <p className="text-sm text-text-secondary italic">
            &ldquo;{learningScore.insight}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
