'use client';

import { Formula } from '@/components/docs/Formula';
import { DiagramLearningScore } from '@/components/docs/DiagramLearningScore';
import { Callout } from '@/components/docs/Callout';

export default function LearningScorePage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Core Concepts
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Learning Score</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
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
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-3xl mb-2">🎯</div>
          <h4 className="font-semibold text-gray-900 mb-1">Accuracy</h4>
          <p className="text-sm text-gray-600">How often your votes align with eventual consensus</p>
          <div className="mt-3 text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">50% weight</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-3xl mb-2">📊</div>
          <h4 className="font-semibold text-gray-900 mb-1">Consistency</h4>
          <p className="text-sm text-gray-600">How stable your accuracy is over time</p>
          <div className="mt-3 text-xs font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded">25% weight</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
          <div className="text-3xl mb-2">📈</div>
          <h4 className="font-semibold text-gray-900 mb-1">Improvement</h4>
          <p className="text-sm text-gray-600">Whether your accuracy is trending upward</p>
          <div className="mt-3 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded">25% weight</div>
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

      <div className="not-prose my-6 p-5 bg-gray-50 rounded-xl font-mono text-sm">
        <div className="text-gray-500 mb-2">// Vote correctness determination</div>
        <div className="text-gray-900">
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
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Score Range</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Interpretation</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Percentile</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-mono">0.8 - 1.0</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-700">Excellent epistemic judgment</td>
              <td className="py-3 px-4 text-gray-600">Top 10%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-mono">0.65 - 0.8</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-700">Strong, reliable judgment</td>
              <td className="py-3 px-4 text-gray-600">Top 30%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="font-mono">0.5 - 0.65</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-700">Developing good instincts</td>
              <td className="py-3 px-4 text-gray-600">Average</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-mono">0.35 - 0.5</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-700">Room for improvement</td>
              <td className="py-3 px-4 text-gray-600">Below average</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-mono">0.0 - 0.35</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-700">Needs attention</td>
              <td className="py-3 px-4 text-gray-600">Bottom 20%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Personalized Insights</h2>

      <p>Based on your learning score components, you&apos;ll receive personalized insights:</p>

      <div className="not-prose space-y-3 my-6">
        {[
          { score: '80%+', color: 'green', insight: 'You have excellent judgment — you correctly identify claim truth values consistently.' },
          { score: '65-80%', color: 'blue', insight: 'You tend to identify true claims early and make sound judgments.' },
          { score: '50-65%', color: 'yellow', insight: "You're developing good epistemic instincts. Keep engaging to improve." },
          { score: '<50%', color: 'red', insight: 'Consider reviewing evidence more carefully before voting.' },
        ].map((item) => (
          <div
            key={item.score}
            className={`p-4 rounded-lg border-l-4 ${
              item.color === 'green' ? 'bg-green-50 border-green-500' :
              item.color === 'blue' ? 'bg-blue-50 border-blue-500' :
              item.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
              'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium text-gray-700">{item.score}</span>
              <span className="text-gray-600 text-sm">{item.insight}</span>
            </div>
          </div>
        ))}
      </div>

      <h2>Expertise Areas</h2>

      <p>
        Your accuracy is also tracked by topic area, creating an expertise profile:
      </p>

      <div className="not-prose my-6 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Example Expertise Profile</h4>
        <div className="space-y-3">
          {[
            { tag: 'Science', accuracy: 85, color: 'blue' },
            { tag: 'Health', accuracy: 78, color: 'green' },
            { tag: 'Technology', accuracy: 72, color: 'purple' },
            { tag: 'History', accuracy: 65, color: 'amber' },
          ].map((item) => (
            <div key={item.tag} className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-medium rounded bg-${item.color}-100 text-${item.color}-700`}>
                #{item.tag}
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${item.color}-500 rounded-full`}
                  style={{ width: `${item.accuracy}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600">{item.accuracy}%</span>
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
            <li key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <h2>Learning Score vs Reputation</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Aspect</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Learning Score</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reputation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700 font-medium">Range</td>
              <td className="py-3 px-4 font-mono">0.0 to 1.0</td>
              <td className="py-3 px-4 font-mono">0 to unlimited</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700 font-medium">Measures</td>
              <td className="py-3 px-4 text-gray-600">Accuracy & improvement</td>
              <td className="py-3 px-4 text-gray-600">Total contribution value</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700 font-medium">Affected by</td>
              <td className="py-3 px-4 text-gray-600">Vote accuracy only</td>
              <td className="py-3 px-4 text-gray-600">Votes, evidence, engagement</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700 font-medium">Use case</td>
              <td className="py-3 px-4 text-gray-600">Personal development metric</td>
              <td className="py-3 px-4 text-gray-600">Platform influence weight</td>
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
