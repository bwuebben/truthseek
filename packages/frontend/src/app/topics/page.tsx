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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Topics</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
        <h1 className="text-2xl font-bold text-gray-900">Topics</h1>
        <p className="text-gray-500 mt-1">
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
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                {letter}
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {groupedTopics[letter].map((topic) => (
                <Link
                  key={topic.tag}
                  href={`/topics/${encodeURIComponent(topic.tag)}`}
                  className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 transition-all',
                    'hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                  )}
                >
                  <span className="text-gray-900 font-medium">{topic.tag}</span>
                  <span className="text-gray-400 text-sm">{topic.claim_count}</span>
                  {topic.recent_activity > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
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
          <p className="text-gray-500">No topics found</p>
        </div>
      )}
    </div>
  );
}
