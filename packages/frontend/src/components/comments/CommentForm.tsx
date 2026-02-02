'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  submitLabel = 'Comment',
  isReply = false,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isSubmitting}
        rows={isReply ? 2 : 3}
        className={clsx(
          'w-full px-3 py-2 bg-dark-800 border border-subtle rounded-lg resize-none text-text-primary placeholder-text-muted',
          'focus:ring-2 focus:ring-accent-coral/50 focus:border-accent-coral/30',
          'disabled:bg-dark-700 disabled:cursor-not-allowed'
        )}
      />

      {error && (
        <p className="text-sm text-accent-coral">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={clsx(
            'btn-primary text-sm',
            (isSubmitting || !content.trim()) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
