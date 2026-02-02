'use client';

import Link from 'next/link';
import { Callout } from '@/components/docs/Callout';

export default function HowItWorksPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Getting Started
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          truthseek is a distributed epistemic verification platform where communities
          collectively assess the truth value of claims through evidence and weighted voting.
        </p>
      </div>

      {/* Core flow visualization */}
      <div className="not-prose my-10">
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

          {[
            {
              step: 1,
              title: 'Submit a Claim',
              desc: 'Anyone can submit a verifiable claim. Claims should be specific, measurable, and falsifiable.',
              icon: '📝',
              color: 'blue',
              example: '"The Great Wall of China is visible from space with the naked eye."',
            },
            {
              step: 2,
              title: 'Submit Evidence',
              desc: 'Community members submit evidence that supports, opposes, or provides neutral context for the claim.',
              icon: '🔍',
              color: 'purple',
              example: 'NASA astronaut statements, scientific studies, photographic analysis...',
            },
            {
              step: 3,
              title: 'Cast Votes',
              desc: 'Participants evaluate the claim based on evidence and cast a vote from 0.0 (false) to 1.0 (true).',
              icon: '🗳️',
              color: 'indigo',
              example: 'Vote 0.15 — lean strongly toward false based on evidence',
            },
            {
              step: 4,
              title: 'Weighted Consensus',
              desc: 'Votes are weighted by reputation. Higher reputation = more influence on the final gradient.',
              icon: '⚖️',
              color: 'violet',
              example: 'Gradient = Σ(vote × weight) / Σ(weight)',
            },
            {
              step: 5,
              title: 'Reach Consensus',
              desc: 'When the gradient crosses 0.8 (true) or falls below 0.2 (false), consensus is reached.',
              icon: '✅',
              color: 'green',
              example: 'Final gradient: 0.12 — Consensus FALSE',
            },
          ].map((item) => (
            <div key={item.step} className="relative flex items-start gap-6 mb-10">
              <div className={`flex-shrink-0 w-16 h-16 bg-${item.color}-100 rounded-xl flex items-center justify-center text-2xl border-4 border-white shadow-lg z-10`}>
                {item.icon}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.step}. {item.title}
                </h3>
                <p className="text-gray-600 mb-3">{item.desc}</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                  {item.example}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2>Key Concepts</h2>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          {
            title: 'Gradient',
            desc: 'A value from 0 to 1 representing collective truth assessment. 0 = false, 1 = true.',
            link: '/docs/gradient-algorithm',
          },
          {
            title: 'Reputation',
            desc: 'Points earned through accurate voting and quality contributions. Determines vote weight.',
            link: '/docs/reputation-system',
          },
          {
            title: 'Tiers',
            desc: 'New, Established, and Trusted — based on reputation. Higher tiers have more privileges.',
            link: '/docs/tier-system',
          },
          {
            title: 'Learning Score',
            desc: 'Personal metric tracking your accuracy and improvement over time.',
            link: '/docs/learning-score',
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.link}
            className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
            <div className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1">
              Learn more
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <h2>Why Weighted Voting?</h2>

      <p>
        Not all votes are equal — and that&apos;s intentional. The weighted voting system
        ensures that people who have demonstrated accurate judgment over time have more
        influence on outcomes.
      </p>

      <div className="not-prose my-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-8 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">👤</div>
            <div className="text-sm text-gray-600">New User</div>
            <div className="text-2xl font-bold text-gray-900">1x</div>
            <div className="text-xs text-gray-500">weight</div>
          </div>
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-sm text-gray-600">Established</div>
            <div className="text-2xl font-bold text-blue-600">3x</div>
            <div className="text-xs text-gray-500">weight</div>
          </div>
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="text-center">
            <div className="text-4xl mb-2">👑</div>
            <div className="text-sm text-gray-600">Trusted</div>
            <div className="text-2xl font-bold text-yellow-600">8x</div>
            <div className="text-xs text-gray-500">weight</div>
          </div>
        </div>
      </div>

      <Callout type="tip" title="Meritocracy of Accuracy">
        Anyone can build reputation through accurate voting. The system rewards good
        epistemic judgment, not popularity or status.
      </Callout>

      <h2>What Makes a Good Claim?</h2>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="text-2xl mb-2">✅</div>
          <h4 className="font-semibold text-green-900">Verifiable</h4>
          <p className="text-sm text-green-700 mt-1">Can be evaluated with evidence</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="text-2xl mb-2">✅</div>
          <h4 className="font-semibold text-green-900">Specific</h4>
          <p className="text-sm text-green-700 mt-1">Clear and unambiguous</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="text-2xl mb-2">✅</div>
          <h4 className="font-semibold text-green-900">Falsifiable</h4>
          <p className="text-sm text-green-700 mt-1">Could be proven wrong</p>
        </div>
      </div>

      <h3>Examples</h3>

      <div className="not-prose space-y-3 my-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-medium text-green-900">&quot;The human body contains approximately 206 bones.&quot;</div>
            <div className="text-sm text-green-700 mt-1">Specific, verifiable through medical science</div>
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <div className="font-medium text-red-900">&quot;Pizza is the best food.&quot;</div>
            <div className="text-sm text-red-700 mt-1">Subjective opinion, not verifiable</div>
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-medium text-green-900">&quot;Regular exercise reduces the risk of heart disease.&quot;</div>
            <div className="text-sm text-green-700 mt-1">Supported by medical research</div>
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <div className="font-medium text-red-900">&quot;Something big will happen next year.&quot;</div>
            <div className="text-sm text-red-700 mt-1">Too vague, unfalsifiable</div>
          </div>
        </div>
      </div>

      <h2>Your Journey</h2>

      <div className="not-prose my-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-blue-900 p-8">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="journey-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#journey-grid)" />
            </svg>
          </div>
          <div className="relative grid md:grid-cols-4 gap-6 text-center">
            {[
              { step: 'Join', rep: '100', desc: 'Start with base reputation' },
              { step: 'Learn', rep: '100-199', desc: 'Observe, vote carefully' },
              { step: 'Grow', rep: '200-499', desc: 'Build track record' },
              { step: 'Lead', rep: '500+', desc: 'Shape the community' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <div className="text-3xl font-bold text-white mb-1">{item.step}</div>
                <div className="text-sm text-blue-200 mb-2">{item.rep} rep</div>
                <div className="text-xs text-blue-300">{item.desc}</div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-4 -right-3 text-blue-400">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2>Ready to Start?</h2>

      <p>
        The best way to learn is by participating. Browse some claims, review the evidence,
        and when you feel confident, cast your first vote.
      </p>

      <div className="not-prose flex flex-wrap gap-3 my-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Explore Claims
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/docs/gradient-algorithm"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Learn the Algorithm
        </Link>
      </div>
    </div>
  );
}
