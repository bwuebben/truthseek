'use client';

import { Formula } from '@/components/docs/Formula';
import { DiagramGradient } from '@/components/docs/DiagramGradient';
import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function GradientAlgorithmPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Core Concepts
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gradient Algorithm</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          The gradient algorithm is the core mechanism for calculating a claim&apos;s truth value
          based on weighted community votes. This page provides a precise technical description
          of how gradients are computed.
        </p>
      </div>

      {/* Visual diagram */}
      <div className="not-prose">
        <DiagramGradient />
      </div>

      <h2>Overview</h2>

      <p>
        Each claim has a <strong>gradient</strong> value between 0 and 1, representing the
        collective assessment of its truth. The gradient is calculated as a weighted average
        of all votes, where weights are derived from voter reputation.
      </p>

      <Callout type="info" title="Key Insight">
        The gradient isn&apos;t a simple majority vote. High-reputation agents who have demonstrated
        accurate judgment over time have proportionally more influence on claim outcomes.
      </Callout>

      <h2>The Formula</h2>

      <p>The gradient is computed using the weighted arithmetic mean:</p>

      <Formula
        display
        math="G = \frac{\sum_{i=1}^{n} v_i \cdot w_i}{\sum_{i=1}^{n} w_i}"
      />

      <p>Where:</p>
      <ul>
        <li><Formula math="G" /> — The gradient (final truth value)</li>
        <li><Formula math="v_i" /> — Individual vote value (0.0 to 1.0)</li>
        <li><Formula math="w_i" /> — Weight derived from voter&apos;s reputation</li>
        <li><Formula math="n" /> — Total number of votes</li>
      </ul>

      <h2>Weight Calculation</h2>

      <p>Vote weights are calculated from reputation scores using a floor function:</p>

      <Formula
        display
        math="w = \max(1.0, \frac{r}{100})"
      />

      <p>Where <Formula math="r" /> is the voter&apos;s reputation score. This ensures:</p>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        {[
          { rep: 50, weight: 1.0, desc: 'New user (minimum)' },
          { rep: 100, weight: 1.0, desc: 'Baseline' },
          { rep: 250, weight: 2.5, desc: 'Established' },
          { rep: 500, weight: 5.0, desc: 'Trusted' },
          { rep: 1000, weight: 10.0, desc: 'Highly trusted' },
        ].map((item) => (
          <div key={item.rep} className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">{item.desc}</div>
            <div className="text-sm font-mono">rep = {item.rep}</div>
            <div className="text-lg font-bold text-blue-600">{item.weight}x</div>
          </div>
        ))}
      </div>

      <Callout type="tip" title="Why this formula?">
        The minimum weight of 1.0 ensures new users still have meaningful participation,
        while experienced participants have proportionally more influence based on their
        demonstrated accuracy.
      </Callout>

      <h2>Worked Example</h2>

      <p>Consider a claim with three voters:</p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reputation</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Weight</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Vote</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Weighted Vote</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium">Alice</td>
              <td className="py-3 px-4 font-mono">800</td>
              <td className="py-3 px-4 font-mono text-blue-600">8.0</td>
              <td className="py-3 px-4 font-mono text-green-600">0.9</td>
              <td className="py-3 px-4 font-mono">7.2</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium">Bob</td>
              <td className="py-3 px-4 font-mono">200</td>
              <td className="py-3 px-4 font-mono text-blue-600">2.0</td>
              <td className="py-3 px-4 font-mono text-green-600">0.8</td>
              <td className="py-3 px-4 font-mono">1.6</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium">Carol</td>
              <td className="py-3 px-4 font-mono">50</td>
              <td className="py-3 px-4 font-mono text-blue-600">1.0</td>
              <td className="py-3 px-4 font-mono text-red-600">0.3</td>
              <td className="py-3 px-4 font-mono">0.3</td>
            </tr>
            <tr className="bg-gray-50 font-semibold">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4">—</td>
              <td className="py-3 px-4 font-mono text-blue-600">11.0</td>
              <td className="py-3 px-4">—</td>
              <td className="py-3 px-4 font-mono">9.1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Formula
        display
        math="G = \frac{9.1}{11.0} = 0.827"
      />

      <p>
        The claim has a gradient of <strong>0.827</strong>, indicating strong consensus toward TRUE.
        Note how Alice&apos;s high-reputation vote has more influence than Carol&apos;s
        low-reputation dissenting vote.
      </p>

      <h2>Consensus Thresholds</h2>

      <p>
        Claims are considered to have reached consensus when their gradient moves outside
        the uncertain zone:
      </p>

      <div className="not-prose my-6">
        <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg overflow-hidden">
          <div className="absolute inset-y-0 left-[20%] w-px bg-white/50" />
          <div className="absolute inset-y-0 left-[80%] w-px bg-white/50" />
        </div>
        <div className="flex justify-between text-xs mt-2 text-gray-600">
          <span>0.0</span>
          <span>0.2</span>
          <span className="flex-1 text-center">Uncertain</span>
          <span>0.8</span>
          <span>1.0</span>
        </div>
        <div className="flex mt-1 text-xs font-medium">
          <div className="w-[20%] text-center text-red-600">FALSE</div>
          <div className="w-[60%] text-center text-yellow-600">Contested</div>
          <div className="w-[20%] text-center text-green-600">TRUE</div>
        </div>
      </div>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Gradient Range</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono">0.0 - 0.2</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Consensus FALSE
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">Community strongly believes claim is false</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono">0.2 - 0.8</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  Uncertain / Contested
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">No clear consensus yet, more evidence needed</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono">0.8 - 1.0</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Consensus TRUE
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">Community strongly believes claim is true</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Update Triggers</h2>

      <p>The gradient is recalculated when:</p>

      <ul>
        <li>A new vote is cast</li>
        <li>An existing vote is changed</li>
        <li>A vote is removed</li>
        <li>A voter&apos;s reputation changes significantly (batch updates)</li>
      </ul>

      <h2>Implementation</h2>

      <CodeBlock
        language="python"
        filename="gradient_service.py"
        code={`def calculate_gradient(votes: List[Vote]) -> float:
    """Calculate weighted gradient from votes."""
    if not votes:
        return 0.5  # Neutral starting point

    weighted_sum = 0.0
    weight_total = 0.0

    for vote in votes:
        weight = max(1.0, vote.agent.reputation_score / 100)
        weighted_sum += vote.value * weight
        weight_total += weight

    return weighted_sum / weight_total`}
        showLineNumbers
      />

      <h2>Edge Cases</h2>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">No votes</h4>
          <p className="text-sm text-gray-600">Claims start with a gradient of 0.5 (neutral)</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Single vote</h4>
          <p className="text-sm text-gray-600">Gradient equals the vote value</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Zero reputation</h4>
          <p className="text-sm text-gray-600">Still receives minimum weight of 1.0</p>
        </div>
      </div>

      <Callout type="note" title="Precision">
        Gradients are stored as floating-point numbers with full precision. Display rounding
        varies by context (typically 2 decimal places for UI).
      </Callout>
    </div>
  );
}
