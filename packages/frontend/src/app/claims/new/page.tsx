'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClaimsStore } from '@/stores/claimsStore';
import { useAuthStore } from '@/stores/authStore';
import clsx from 'clsx';

export default function NewClaimPage() {
  const router = useRouter();
  const { createClaim } = useClaimsStore();
  const { isAuthenticated, isLoading } = useAuthStore();

  const [statement, setStatement] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'moderate' | 'complex' | 'contested'>('simple');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (statement.trim().length < 10) {
      setError('Statement must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const claim = await createClaim(statement.trim(), {
        complexity_tier: complexity,
        tags: tagList,
      });

      router.push(`/claims/${claim.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Create New Claim
      </h1>

      <form onSubmit={handleSubmit} className="card">
        {/* Statement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Statement
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Enter a clear, verifiable statement..."
            rows={4}
            className="input resize-none"
          />
          <p className="mt-1 text-sm text-text-muted">
            Make your claim specific and verifiable. Good claims can be proven
            true or false with evidence.
          </p>
        </div>

        {/* Complexity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Complexity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: 'simple',
                label: 'Simple',
                description: 'Easily verifiable facts',
              },
              {
                value: 'moderate',
                label: 'Moderate',
                description: 'Requires domain knowledge',
              },
              {
                value: 'complex',
                label: 'Complex',
                description: 'Requires deep expertise',
              },
              {
                value: 'contested',
                label: 'Contested',
                description: 'Genuinely disputed topic',
              },
            ].map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setComplexity(value as any)}
                className={clsx(
                  'p-3 rounded-lg text-left transition-colors border-2',
                  complexity === value
                    ? 'border-accent-coral/50 bg-accent-coral/10'
                    : 'border-subtle hover:border-subtle-hover'
                )}
              >
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-sm text-text-muted">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="science, technology, health (comma separated)"
            className="input"
          />
        </div>

        {error && (
          <div className="mb-6 p-3 bg-accent-coral/10 text-accent-coral border border-accent-coral/30 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Create Claim'}
          </button>
        </div>
      </form>
    </div>
  );
}
