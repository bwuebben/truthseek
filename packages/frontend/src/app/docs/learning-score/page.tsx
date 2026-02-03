'use client';

import { Formula } from '@/components/docs/Formula';
import { DiagramLearningScore } from '@/components/docs/DiagramLearningScore';
import { Callout } from '@/components/docs/Callout';

export default function LearningScorePage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-accent-coral font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Core Concepts
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">Learning Score</h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          The Learning Score measures your epistemic development — how well you
          identify truth and adapt your judgment over time. Unlike reputation, which
          measures total contribution, learning score focuses on accuracy and improvement.
        </p>
      </div>

      {/* Visual diagram */}
      <div className="not-prose">
        <DiagramLearningScore />
      </div>

      <h2>What It Measures</h2>

      <p>
        Your learning score is a composite metric (0.0 to 1.0) that captures three
        dimensions of epistemic performance:
      </p>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="p-5 bg-accent-coral/10 rounded-xl border border-accent-coral/30">
          <div className="text-3xl mb-2">🎯</div>
          <h4 className="font-semibold text-text-primary mb-1">Accuracy</h4>
          <p className="text-sm text-text-secondary">How often your votes align with eventual consensus</p>
          <div className="mt-3 text-xs font-mono text-accent-coral bg-accent-coral/20 px-2 py-1 rounded">50% weight</div>
        </div>
        <div className="p-5 bg-accent-cyan/10 rounded-xl border border-accent-cyan/30">
          <div className="text-3xl mb-2">📊</div>
          <h4 className="font-semibold text-text-primary mb-1">Consistency</h4>
          <p className="text-sm text-text-secondary">How stable your accuracy is over time</p>
          <div className="mt-3 text-xs font-mono text-accent-cyan bg-accent-cyan/20 px-2 py-1 rounded">25% weight</div>
        </div>
        <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="text-3xl mb-2">📈</div>
          <h4 className="font-semibold text-text-primary mb-1">Improvement</h4>
          <p className="text-sm text-text-secondary">Whether your accuracy is trending upward</p>
          <div className="mt-3 text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">25% weight</div>
        </div>
      </div>

      <h2>The Formula</h2>

      <Formula
        display
        math="L = 0.5 \cdot A + 0.25 \cdot C + 0.25 \cdot I"
      />

      <p>Where:</p>
      <ul>
        <li><Formula math="L" /> — Learning score (0 to 1)</li>
        <li><Formula math="A" /> — Accuracy rate</li>
        <li><Formula math="C" /> — Consistency score</li>
        <li><Formula math="I" /> — Improvement trajectory</li>
      </ul>

      <h3>Accuracy Rate</h3>

      <Formula
        display
        math="A = \frac{\text{correct resolved votes}}{\text{total resolved votes}}"
      />

      <p>A vote is considered correct when:</p>

      <div className="not-prose my-6 p-5 bg-dark-700 rounded-xl font-mono text-sm border border-subtle">
        <div className="text-text-muted mb-2">// Vote correctness determination</div>
        <div className="text-text-primary">
          is_correct = (vote &gt; 0.5 AND gradient &gt; 0.8) OR<br/>
          <span className="ml-12">(vote &lt; 0.5 AND gradient &lt; 0.2)</span>
        </div>
      </div>

      <Callout type="info" title="Only Resolved Claims Count">
        Only votes on claims that have reached consensus (gradient &gt; 0.8 or &lt; 0.2)
        count toward your accuracy rate. Votes on contested claims don&apos;t affect it.
      </Callout>

      <h3>Consistency Score</h3>

      <Formula
        display
        math="C = 1 - \text{variance}(\text{accuracy windows})"
      />

      <p>
        Measured by looking at your accuracy in rolling windows (e.g., weekly) and
        calculating how stable it is. Lower variance = higher consistency.
      </p>

      <h3>Improvement Trajectory</h3>

      <Formula
        display
        math="I = \text{normalize}(\text{slope}(\text{accuracy over time}))"
      />

      <p>
        The slope of your accuracy trend line over recent periods, normalized to [0, 1].
        Positive trends score higher.
      </p>

      <h2>Score Interpretation</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Score Range</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Interpretation</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Percentile</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-mono text-text-primary">0.8 - 1.0</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary">Excellent epistemic judgment</td>
              <td className="py-3 px-4 text-text-muted">Top 10%</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-cyan" />
                  <span className="font-mono text-text-primary">0.65 - 0.8</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary">Strong, reliable judgment</td>
              <td className="py-3 px-4 text-text-muted">Top 30%</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-mono text-text-primary">0.5 - 0.65</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary">Developing good instincts</td>
              <td className="py-3 px-4 text-text-muted">Average</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-mono text-text-primary">0.35 - 0.5</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary">Room for improvement</td>
              <td className="py-3 px-4 text-text-muted">Below average</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-coral" />
                  <span className="font-mono text-text-primary">0.0 - 0.35</span>
                </div>
              </td>
              <td className="py-3 px-4 text-text-secondary">Needs attention</td>
              <td className="py-3 px-4 text-text-muted">Bottom 20%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Personalized Insights</h2>

      <p>Based on your learning score components, you&apos;ll receive personalized insights:</p>

      <div className="not-prose space-y-3 my-6">
        {[
          { score: '80%+', color: 'emerald', insight: 'You have excellent judgment — you correctly identify claim truth values consistently.' },
          { score: '65-80%', color: 'cyan', insight: 'You tend to identify true claims early and make sound judgments.' },
          { score: '50-65%', color: 'amber', insight: "You're developing good epistemic instincts. Keep engaging to improve." },
          { score: '<50%', color: 'coral', insight: 'Consider reviewing evidence more carefully before voting.' },
        ].map((item) => (
          <div
            key={item.score}
            className={`p-4 rounded-lg border-l-4 ${
              item.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500' :
              item.color === 'cyan' ? 'bg-accent-cyan/10 border-accent-cyan' :
              item.color === 'amber' ? 'bg-amber-500/10 border-amber-500' :
              'bg-accent-coral/10 border-accent-coral'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium text-text-secondary">{item.score}</span>
              <span className="text-text-secondary text-sm">{item.insight}</span>
            </div>
          </div>
        ))}
      </div>

      <h2>Expertise Areas</h2>

      <p>
        Your accuracy is also tracked by topic area, creating an expertise profile:
      </p>

      <div className="not-prose my-6 p-5 bg-dark-800 rounded-xl border border-subtle">
        <h4 className="font-semibold text-text-primary mb-4">Example Expertise Profile</h4>
        <div className="space-y-3">
          {[
            { tag: 'Science', accuracy: 85, color: 'coral' },
            { tag: 'Health', accuracy: 78, color: 'emerald' },
            { tag: 'Technology', accuracy: 72, color: 'cyan' },
            { tag: 'History', accuracy: 65, color: 'amber' },
          ].map((item) => (
            <div key={item.tag} className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                item.color === 'coral' ? 'bg-accent-coral/20 text-accent-coral' :
                item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                item.color === 'cyan' ? 'bg-accent-cyan/20 text-accent-cyan' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                #{item.tag}
              </span>
              <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.color === 'coral' ? 'bg-accent-coral' :
                    item.color === 'emerald' ? 'bg-emerald-500' :
                    item.color === 'cyan' ? 'bg-accent-cyan' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${item.accuracy}%` }}
                />
              </div>
              <span className="text-sm font-mono text-text-muted">{item.accuracy}%</span>
            </div>
          ))}
        </div>
      </div>

      <Callout type="tip" title="Play to Your Strengths">
        Focus your voting on topics where you have genuine expertise. Your expertise
        profile helps you understand where your judgment is strongest.
      </Callout>

      <h2>Improving Your Learning Score</h2>

      <div className="not-prose my-6">
        <ol className="space-y-4">
          {[
            {
              title: 'Read evidence thoroughly',
              desc: "Don't vote based on gut feeling. Review the evidence submitted for each claim.",
            },
            {
              title: 'Start with what you know',
              desc: 'Vote in areas where you have genuine knowledge or expertise.',
            },
            {
              title: 'Wait for evidence',
              desc: 'On new claims, wait for evidence to accumulate before voting.',
            },
            {
              title: 'Learn from mistakes',
              desc: 'When a claim you voted on reaches consensus against you, study why.',
            },
            {
              title: 'Be calibrated',
              desc: 'Use moderate votes (0.3-0.7) when uncertain, strong votes only when confident.',
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-4 p-4 bg-dark-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-coral text-dark-900 rounded-full flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{step.title}</h4>
                <p className="text-sm text-text-secondary mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <h2>Learning Score vs Reputation</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Aspect</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Learning Score</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Reputation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 text-text-secondary font-medium">Range</td>
              <td className="py-3 px-4 font-mono text-text-primary">0.0 to 1.0</td>
              <td className="py-3 px-4 font-mono text-text-primary">0 to unlimited</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 text-text-secondary font-medium">Measures</td>
              <td className="py-3 px-4 text-text-muted">Accuracy & improvement</td>
              <td className="py-3 px-4 text-text-muted">Total contribution value</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 text-text-secondary font-medium">Affected by</td>
              <td className="py-3 px-4 text-text-muted">Vote accuracy only</td>
              <td className="py-3 px-4 text-text-muted">Votes, evidence, engagement</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 text-text-secondary font-medium">Use case</td>
              <td className="py-3 px-4 text-text-muted">Personal development metric</td>
              <td className="py-3 px-4 text-text-muted">Platform influence weight</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Both metrics matter. Reputation determines your influence; learning score
        helps you understand and improve your judgment quality.
      </p>
    </div>
  );
}
