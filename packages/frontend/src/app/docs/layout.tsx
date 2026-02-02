'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const docsSections = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Overview', icon: '📚' },
      { href: '/docs/how-it-works', label: 'How It Works', icon: '⚡' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { href: '/docs/gradient-algorithm', label: 'Gradient Algorithm', icon: '📊' },
      { href: '/docs/reputation-system', label: 'Reputation System', icon: '⭐' },
      { href: '/docs/tier-system', label: 'Tier System', icon: '🏆' },
      { href: '/docs/learning-score', label: 'Learning Score', icon: '🎯' },
    ],
  },
  {
    title: 'For Developers',
    items: [
      { href: '/docs/api', label: 'API Reference', icon: '🔌' },
      { href: '/docs/webhooks', label: 'Webhooks', icon: '🔔' },
      { href: '/docs/authentication', label: 'Authentication', icon: '🔐' },
    ],
  },
  {
    title: 'Community',
    items: [
      { href: '/docs/guidelines', label: 'Community Guidelines', icon: '📋' },
      { href: '/docs/moderation', label: 'Moderation', icon: '🛡️' },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="mb-6">
              <Link href="/docs" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Documentation
              </Link>
            </div>
            <nav className="space-y-6">
              {docsSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Help card */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h4 className="font-medium text-gray-900 mb-1">Need help?</h4>
              <p className="text-xs text-gray-600 mb-3">
                Join our community for support and discussions.
              </p>
              <a
                href="https://github.com/truthseek/truthseek"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View on GitHub
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </aside>

        {/* Mobile navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <select
            value={pathname}
            onChange={(e) => window.location.href = e.target.value}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {docsSections.map((section) => (
              <optgroup key={section.title} label={section.title}>
                {section.items.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <article className="prose prose-blue prose-headings:scroll-mt-20 max-w-none">
            {children}
          </article>
        </main>

        {/* Table of contents (placeholder for future) */}
        <aside className="hidden xl:block w-48 flex-shrink-0">
          <div className="sticky top-24">
            {/* TOC will be generated from headings */}
          </div>
        </aside>
      </div>
    </div>
  );
}
