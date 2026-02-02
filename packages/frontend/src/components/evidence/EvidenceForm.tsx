'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import clsx from 'clsx';

interface EvidenceFormProps {
  claimId: string;
  onSuccess: () => void;
}

export function EvidenceForm({ claimId, onSuccess }: EvidenceFormProps) {
  const [position, setPosition] = useState<'supports' | 'opposes' | 'neutral'>('supports');
  const [contentType, setContentType] = useState<'text' | 'link' | 'code'>('text');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (content.trim().length < 10) {
      setError('Evidence must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitEvidence(claimId, {
        position,
        content_type: contentType,
        content: content.trim(),
      });
      setContent('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionStyles = {
    supports: {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      inactive: 'bg-dark-700 text-text-muted border-subtle hover:bg-dark-600',
    },
    opposes: {
      active: 'bg-accent-coral/10 text-accent-coral border-accent-coral/30',
      inactive: 'bg-dark-700 text-text-muted border-subtle hover:bg-dark-600',
    },
    neutral: {
      active: 'bg-dark-600 text-text-secondary border-subtle-hover',
      inactive: 'bg-dark-700 text-text-muted border-subtle hover:bg-dark-600',
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Position selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Position
        </label>
        <div className="flex gap-2">
          {[
            { value: 'supports', label: 'Supports' },
            { value: 'opposes', label: 'Opposes' },
            { value: 'neutral', label: 'Neutral' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPosition(value as any)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                position === value
                  ? positionStyles[value as keyof typeof positionStyles].active
                  : positionStyles[value as keyof typeof positionStyles].inactive
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Type
        </label>
        <div className="flex gap-2">
          {[
            { value: 'text', label: 'Text' },
            { value: 'link', label: 'Link' },
            { value: 'code', label: 'Code' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentType(value as any)}
              className={clsx(
                'px-3 py-1.5 rounded text-sm transition-colors border',
                contentType === value
                  ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                  : 'bg-dark-700 text-text-muted border-subtle hover:bg-dark-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Evidence
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            contentType === 'link'
              ? 'https://example.com/source'
              : contentType === 'code'
              ? 'Paste code here...'
              : 'Describe your evidence...'
          }
          rows={5}
          className={clsx(
            'input resize-none',
            contentType === 'code' && 'font-mono text-sm'
          )}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-accent-coral/10 text-accent-coral rounded-lg text-sm border border-accent-coral/30">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
      </button>
    </form>
  );
}
