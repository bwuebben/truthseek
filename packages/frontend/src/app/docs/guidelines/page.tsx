'use client';

import { Callout } from '@/components/docs/Callout';

export default function GuidelinesPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Community
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Guidelines</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          truthseek is a platform for collective truth-seeking. These guidelines help
          maintain a productive environment where diverse perspectives can contribute
          to finding truth through evidence and reasoning.
        </p>
      </div>

      <h2>Core Principles</h2>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-gray-900 mb-2">Truth Over Agreement</h3>
          <p className="text-sm text-gray-600">
            The goal is to find truth, not to confirm what we already believe. Be willing
            to change your position when evidence warrants it.
          </p>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Evidence Over Opinion</h3>
          <p className="text-sm text-gray-600">
            Claims should be evaluated based on evidence, not personal preference or
            popularity. Cite sources and explain their relevance.
          </p>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="font-semibold text-gray-900 mb-2">Good Faith</h3>
          <p className="text-sm text-gray-600">
            Assume others are genuinely trying to find truth. Disagreement is healthy;
            hostility is not. Critique arguments, not people.
          </p>
        </div>
      </div>

      <h2>Claim Submission</h2>

      <h3>What Makes a Good Claim</h3>

      <div className="not-prose my-6 space-y-3">
        {[
          { icon: '✅', title: 'Verifiable', desc: 'Can be evaluated with evidence. "The Eiffel Tower is 330m tall" vs "Paris is the best city"' },
          { icon: '✅', title: 'Specific', desc: 'Clear enough that people know what they\'re evaluating. Avoid vague wording.' },
          { icon: '✅', title: 'Neutral framing', desc: 'State claims objectively without loaded language that presumes the answer.' },
          { icon: '✅', title: 'Appropriate complexity', desc: 'Tag claims accurately so voters understand the required expertise level.' },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
            <span className="text-xl">{item.icon}</span>
            <div>
              <span className="font-medium text-gray-900">{item.title}:</span>{' '}
              <span className="text-gray-600">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <h3>Claims to Avoid</h3>

      <div className="not-prose my-6 space-y-3">
        {[
          { desc: 'Pure opinions ("X is better than Y" without measurable criteria)' },
          { desc: 'Future predictions unless time-bounded' },
          { desc: 'Unfalsifiable claims' },
          { desc: 'Claims requiring private information to verify' },
          { desc: 'Duplicate claims (search first!)' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
            <span className="text-xl">❌</span>
            <span className="text-gray-700">{item.desc}</span>
          </div>
        ))}
      </div>

      <h2>Voting Guidelines</h2>

      <h3>Vote Based on Evidence</h3>

      <p>Your vote should reflect your honest assessment of the claim&apos;s truth value based on:</p>

      <ul>
        <li>Quality and quantity of evidence submitted</li>
        <li>Source credibility</li>
        <li>Your domain knowledge</li>
        <li>Logical consistency</li>
      </ul>

      <h3>Use the Full Gradient</h3>

      <div className="not-prose my-6">
        <div className="relative">
          <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <div className="flex justify-between text-xs mt-2 font-mono text-gray-600">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center">
          <div className="p-2 bg-red-50 rounded">
            <div className="font-mono text-red-700">0.0-0.2</div>
            <div className="text-red-600">Strongly false</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="font-mono text-orange-700">0.2-0.4</div>
            <div className="text-orange-600">Lean false</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <div className="font-mono text-yellow-700">0.4-0.6</div>
            <div className="text-yellow-600">Uncertain</div>
          </div>
          <div className="p-2 bg-lime-50 rounded">
            <div className="font-mono text-lime-700">0.6-0.8</div>
            <div className="text-lime-600">Lean true</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="font-mono text-green-700">0.8-1.0</div>
            <div className="text-green-600">Strongly true</div>
          </div>
        </div>
      </div>

      <Callout type="tip" title="Update Your Votes">
        You can change your vote as new evidence emerges. There&apos;s no penalty for
        changing your mind based on new information — that&apos;s good epistemic practice.
      </Callout>

      <h3>Don&apos;t Game the System</h3>

      <Callout type="warning" title="Prohibited Behaviors">
        <ul className="mt-2 space-y-1 text-sm">
          <li>• Coordinated voting to artificially shift gradients</li>
          <li>• Creating multiple accounts to multiply votes</li>
          <li>• Voting based on who submitted, not content</li>
          <li>• Revenge voting on unrelated claims</li>
        </ul>
      </Callout>

      <h2>Evidence Standards</h2>

      <h3>Quality Evidence</h3>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          { icon: '🎯', title: 'Relevant', desc: 'Directly addresses the claim at hand' },
          { icon: '📎', title: 'Sourced', desc: 'Links to primary sources when possible' },
          { icon: '💬', title: 'Explained', desc: 'Includes context for why it\'s relevant' },
          { icon: '⚖️', title: 'Honest', desc: 'Represents sources accurately, including limitations' },
        ].map((item) => (
          <div key={item.title} className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h3>Source Hierarchy</h3>

      <p>Not all sources are equal. Generally prioritize:</p>

      <div className="not-prose my-6">
        <ol className="space-y-2">
          {[
            { rank: 1, source: 'Primary sources (original documents, raw data)', quality: 'highest' },
            { rank: 2, source: 'Peer-reviewed research', quality: 'high' },
            { rank: 3, source: 'Expert analysis from credible institutions', quality: 'good' },
            { rank: 4, source: 'Quality journalism with named sources', quality: 'moderate' },
            { rank: 5, source: 'Secondary commentary and opinion', quality: 'lower' },
          ].map((item) => (
            <li key={item.rank} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                {item.rank}
              </div>
              <span className="flex-1 text-gray-700">{item.source}</span>
            </li>
          ))}
        </ol>
      </div>

      <h2>Discussion & Comments</h2>

      <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
        <div className="p-5 bg-green-50 rounded-xl border border-green-100">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span className="text-lg">✅</span> Constructive Comments
          </h4>
          <ul className="text-sm text-green-800 space-y-2">
            <li>Ask clarifying questions</li>
            <li>Point out logical issues</li>
            <li>Suggest evidence sources</li>
            <li>Explain your reasoning</li>
          </ul>
        </div>
        <div className="p-5 bg-red-50 rounded-xl border border-red-100">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <span className="text-lg">❌</span> Prohibited Comments
          </h4>
          <ul className="text-sm text-red-800 space-y-2">
            <li>Personal attacks or harassment</li>
            <li>Off-topic tangents</li>
            <li>Spam or promotional content</li>
            <li>Threats or doxxing</li>
          </ul>
        </div>
      </div>

      <h2>Prohibited Content</h2>

      <p>The following are not permitted on truthseek:</p>

      <div className="not-prose my-6 p-5 bg-red-50 rounded-xl border border-red-200">
        <ul className="space-y-2 text-sm text-red-800">
          <li>• Content that violates applicable laws</li>
          <li>• Calls for violence or harassment</li>
          <li>• Doxxing or invasion of privacy</li>
          <li>• Spam, scams, or malware</li>
          <li>• Sexually explicit content</li>
          <li>• Content that exploits minors</li>
        </ul>
      </div>

      <h2>Enforcement</h2>

      <p>Violations may result in:</p>

      <div className="not-prose my-6 flex flex-wrap gap-3">
        {[
          { action: 'Content removal', severity: 'low' },
          { action: 'Reputation penalty', severity: 'medium' },
          { action: 'Privilege restriction', severity: 'medium' },
          { action: 'Account suspension', severity: 'high' },
        ].map((item) => (
          <div
            key={item.action}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              item.severity === 'low' ? 'bg-yellow-100 text-yellow-800' :
              item.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {item.action}
          </div>
        ))}
      </div>

      <p>
        See the <a href="/docs/moderation" className="text-blue-600 hover:underline">Moderation</a> page
        for details on the moderation process and appeals.
      </p>
    </div>
  );
}
