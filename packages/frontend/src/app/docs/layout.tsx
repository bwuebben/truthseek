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
              <Link href="/docs" className="flex items-center gap-2 text-lg font-bold text-text-primary">
                <svg className="w-6 h-6 text-accent-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Documentation
              </Link>
            </div>
            <nav className="space-y-6">
              {docsSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
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
                                ? 'bg-accent-coral/10 text-accent-coral font-medium border border-accent-coral/30'
                                : 'text-text-secondary hover:bg-dark-700 hover:text-text-primary'
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
            <div className="mt-8 p-4 bg-dark-700 rounded-xl border border-subtle">
              <h4 className="font-medium text-text-primary mb-1">Need help?</h4>
              <p className="text-xs text-text-muted mb-3">
                Join our community for support and discussions.
              </p>
              <a
                href="https://github.com/truthseek/truthseek"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-coral hover:text-accent-coral-hover"
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-subtle px-4 py-2 z-50">
          <select
            value={pathname}
            onChange={(e) => window.location.href = e.target.value}
            className="w-full px-3 py-2 bg-dark-700 border border-subtle rounded-lg text-sm text-text-primary"
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
          <article className="prose prose-invert prose-headings:text-text-primary prose-headings:scroll-mt-20 prose-p:text-text-secondary prose-a:text-accent-coral prose-strong:text-text-primary prose-code:text-accent-cyan max-w-none">
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
