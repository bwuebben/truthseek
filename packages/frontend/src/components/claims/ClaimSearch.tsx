'use client';

import { useState } from 'react';
import { useClaimsStore } from '@/stores/claimsStore';

export function ClaimSearch() {
  const { searchParams, fetchClaims } = useClaimsStore();
  const [query, setQuery] = useState(searchParams.q || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClaims({ q: query || undefined, offset: 0 });
  };

  const handleSortChange = (sortBy: 'created_at' | 'gradient' | 'vote_count') => {
    fetchClaims({ sort_by: sortBy, offset: 0 });
  };

  return (
    <div className="card">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search claims..."
          className="input flex-grow"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      <div className="flex items-center gap-4 mt-4">
        <span className="text-sm text-text-muted">Sort by:</span>
        <div className="flex gap-2">
          {[
            { key: 'created_at', label: 'Recent' },
            { key: 'gradient', label: 'Gradient' },
            { key: 'vote_count', label: 'Most Voted' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortChange(key as any)}
              className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                searchParams.sort_by === key
                  ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                  : 'bg-dark-700 text-text-secondary border-subtle hover:border-subtle-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
