'use client';

import { Callout } from '@/components/docs/Callout';

export default function GuidelinesPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-accent-coral font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Community
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">Community Guidelines</h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          truthseek is a platform for collective truth-seeking. These guidelines help
          maintain a productive environment where diverse perspectives can contribute
          to finding truth through evidence and reasoning.
        </p>
      </div>

      <h2>Core Principles</h2>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="p-5 bg-accent-coral/10 rounded-xl border border-accent-coral/30">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-text-primary mb-2">Truth Over Agreement</h3>
          <p className="text-sm text-text-secondary">
            The goal is to find truth, not to confirm what we already believe. Be willing
            to change your position when evidence warrants it.
          </p>
        </div>
        <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-semibold text-text-primary mb-2">Evidence Over Opinion</h3>
          <p className="text-sm text-text-secondary">
            Claims should be evaluated based on evidence, not personal preference or
            popularity. Cite sources and explain their relevance.
          </p>
        </div>
        <div className="p-5 bg-accent-cyan/10 rounded-xl border border-accent-cyan/30">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="font-semibold text-text-primary mb-2">Good Faith</h3>
          <p className="text-sm text-text-secondary">
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
          <div key={item.title} className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <span className="text-xl">{item.icon}</span>
            <div>
              <span className="font-medium text-text-primary">{item.title}:</span>{' '}
              <span className="text-text-secondary">{item.desc}</span>
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
          <div key={i} className="flex items-start gap-3 p-4 bg-accent-coral/10 rounded-lg border border-accent-coral/30">
            <span className="text-xl">❌</span>
            <span className="text-text-secondary">{item.desc}</span>
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
          <div className="h-4 rounded-full bg-gradient-to-r from-accent-coral via-amber-500 to-emerald-500" />
          <div className="flex justify-between text-xs mt-2 font-mono text-text-muted">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center">
          <div className="p-2 bg-accent-coral/10 rounded border border-accent-coral/30">
            <div className="font-mono text-accent-coral">0.0-0.2</div>
            <div className="text-text-secondary">Strongly false</div>
          </div>
          <div className="p-2 bg-orange-500/10 rounded border border-orange-500/30">
            <div className="font-mono text-orange-400">0.2-0.4</div>
            <div className="text-text-secondary">Lean false</div>
          </div>
          <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
            <div className="font-mono text-amber-400">0.4-0.6</div>
            <div className="text-text-secondary">Uncertain</div>
          </div>
          <div className="p-2 bg-lime-500/10 rounded border border-lime-500/30">
            <div className="font-mono text-lime-400">0.6-0.8</div>
            <div className="text-text-secondary">Lean true</div>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
            <div className="font-mono text-emerald-400">0.8-1.0</div>
            <div className="text-text-secondary">Strongly true</div>
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
          <div key={item.title} className="p-4 bg-dark-700 rounded-lg flex items-start gap-3 border border-subtle">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className="font-semibold text-text-primary">{item.title}</h4>
              <p className="text-sm text-text-secondary">{item.desc}</p>
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
            <li key={item.rank} className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg border border-subtle">
              <div className="w-8 h-8 bg-accent-coral/20 text-accent-coral rounded-full flex items-center justify-center font-bold text-sm border border-accent-coral/30">
                {item.rank}
              </div>
              <span className="flex-1 text-text-secondary">{item.source}</span>
            </li>
          ))}
        </ol>
      </div>

      <h2>Discussion & Comments</h2>

      <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
        <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-lg">✅</span> Constructive Comments
          </h4>
          <ul className="text-sm text-text-secondary space-y-2">
            <li>Ask clarifying questions</li>
            <li>Point out logical issues</li>
            <li>Suggest evidence sources</li>
            <li>Explain your reasoning</li>
          </ul>
        </div>
        <div className="p-5 bg-accent-coral/10 rounded-xl border border-accent-coral/30">
          <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-lg">❌</span> Prohibited Comments
          </h4>
          <ul className="text-sm text-text-secondary space-y-2">
            <li>Personal attacks or harassment</li>
            <li>Off-topic tangents</li>
            <li>Spam or promotional content</li>
            <li>Threats or doxxing</li>
          </ul>
        </div>
      </div>

      <h2>Prohibited Content</h2>

      <p>The following are not permitted on truthseek:</p>

      <div className="not-prose my-6 p-5 bg-accent-coral/10 rounded-xl border border-accent-coral/30">
        <ul className="space-y-2 text-sm text-text-secondary">
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
              item.severity === 'low' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              item.severity === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              'bg-accent-coral/20 text-accent-coral border border-accent-coral/30'
            }`}
          >
            {item.action}
          </div>
        ))}
      </div>

      <p>
        See the <a href="/docs/moderation" className="text-accent-coral hover:underline">Moderation</a> page
        for details on the moderation process and appeals.
      </p>
    </div>
  );
}
