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

  return (
    <form onSubmit={handleSubmit}>
      {/* Position selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Position
        </label>
        <div className="flex gap-2">
          {[
            { value: 'supports', label: 'Supports', color: 'green' },
            { value: 'opposes', label: 'Opposes', color: 'red' },
            { value: 'neutral', label: 'Neutral', color: 'gray' },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPosition(value as any)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                position === value
                  ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={{
                backgroundColor: position === value
                  ? color === 'green'
                    ? '#dcfce7'
                    : color === 'red'
                    ? '#fee2e2'
                    : '#f3f4f6'
                  : undefined,
                color: position === value
                  ? color === 'green'
                    ? '#15803d'
                    : color === 'red'
                    ? '#b91c1c'
                    : '#374151'
                  : undefined,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                'px-3 py-1.5 rounded text-sm transition-colors',
                contentType === value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
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
