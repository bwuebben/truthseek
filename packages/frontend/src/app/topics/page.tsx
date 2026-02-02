'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDiscoverStore } from '@/stores/discoverStore';
import clsx from 'clsx';

export default function TopicsPage() {
  const { topics, isLoadingTopics, fetchTopics } = useDiscoverStore();

  useEffect(() => {
    fetchTopics(100);
  }, [fetchTopics]);

  if (isLoadingTopics) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Topics</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
        </div>
      </div>
    );
  }

  // Group topics by first letter
  const groupedTopics = topics.reduce((acc, topic) => {
    const letter = topic.tag.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(topic);
    return acc;
  }, {} as Record<string, typeof topics>);

  const letters = Object.keys(groupedTopics).sort();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Topics</h1>
        <p className="text-text-muted mt-1">
          Browse claims by topic
        </p>
      </div>

      {/* Quick navigation */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#${letter}`}
              className="w-8 h-8 flex items-center justify-center rounded bg-dark-700 text-text-secondary font-medium hover:bg-accent-coral/10 hover:text-accent-coral transition-colors border border-subtle"
            >
              {letter}
            </a>
          ))}
        </div>
      </div>

      {/* Topics by letter */}
      <div className="space-y-8">
        {letters.map((letter) => (
          <div key={letter} id={letter}>
            <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-accent-coral/10 text-accent-coral flex items-center justify-center border border-accent-coral/30">
                {letter}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {groupedTopics[letter].map((topic) => (
                <Link
                  key={topic.tag}
                  href={`/topics/${encodeURIComponent(topic.tag)}`}
                  className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-700 border border-subtle transition-all',
                    'hover:border-accent-coral/30 hover:bg-accent-coral/10'
                  )}
                >
                  <span className="text-text-primary font-medium">{topic.tag}</span>
                  <span className="text-text-muted text-sm">{topic.claim_count}</span>
                  {topic.recent_activity > 0 && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      +{topic.recent_activity}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-text-muted">No topics found</p>
        </div>
      )}
    </div>
  );
}
