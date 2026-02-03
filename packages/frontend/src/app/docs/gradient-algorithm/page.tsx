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
        <div className="inline-flex items-center gap-2 text-sm text-accent-coral font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Core Concepts
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">Gradient Algorithm</h1>
        <p className="text-lg text-text-secondary max-w-3xl">
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

      <p>Vote weights are calculated from reputation scores using a logarithmic function:</p>

      <Formula
        display
        math="w = \max(0.1, \log(1 + r))"
      />

      <p>Where <Formula math="r" /> is the voter&apos;s reputation score. The logarithm provides diminishing returns:</p>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        {[
          { rep: 0, weight: 0.1, desc: 'New user (minimum)' },
          { rep: 10, weight: 2.4, desc: 'Early contributor' },
          { rep: 100, weight: 4.6, desc: 'Established' },
          { rep: 500, weight: 6.2, desc: 'Trusted' },
          { rep: 1000, weight: 6.9, desc: 'Highly trusted' },
        ].map((item) => (
          <div key={item.rep} className="bg-dark-700 rounded-lg p-4 text-center border border-subtle">
            <div className="text-xs text-text-muted mb-1">{item.desc}</div>
            <div className="text-sm font-mono text-text-secondary">rep = {item.rep}</div>
            <div className="text-lg font-bold text-accent-coral">{item.weight}x</div>
          </div>
        ))}
      </div>

      <Callout type="tip" title="Why logarithmic weighting?">
        Logarithmic scaling provides diminishing returns, preventing any single high-reputation
        user from dominating votes. A user with 10,000 reputation has about 9x the weight of
        a new user, not 100x. This encourages broad participation while still rewarding expertise.
      </Callout>

      <h2>Worked Example</h2>

      <p>Consider a claim with three voters:</p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Voter</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Reputation</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Weight (log(1+r))</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Vote</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Weighted Vote</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-medium text-text-primary">Alice</td>
              <td className="py-3 px-4 font-mono text-text-secondary">800</td>
              <td className="py-3 px-4 font-mono text-accent-coral">6.69</td>
              <td className="py-3 px-4 font-mono text-emerald-400">0.9</td>
              <td className="py-3 px-4 font-mono text-text-secondary">6.02</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-medium text-text-primary">Bob</td>
              <td className="py-3 px-4 font-mono text-text-secondary">200</td>
              <td className="py-3 px-4 font-mono text-accent-coral">5.30</td>
              <td className="py-3 px-4 font-mono text-emerald-400">0.8</td>
              <td className="py-3 px-4 font-mono text-text-secondary">4.24</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-medium text-text-primary">Carol</td>
              <td className="py-3 px-4 font-mono text-text-secondary">50</td>
              <td className="py-3 px-4 font-mono text-accent-coral">3.93</td>
              <td className="py-3 px-4 font-mono text-accent-coral">0.3</td>
              <td className="py-3 px-4 font-mono text-text-secondary">1.18</td>
            </tr>
            <tr className="bg-dark-700 font-semibold">
              <td className="py-3 px-4 text-text-primary">Total</td>
              <td className="py-3 px-4 text-text-muted">—</td>
              <td className="py-3 px-4 font-mono text-accent-coral">15.92</td>
              <td className="py-3 px-4 text-text-muted">—</td>
              <td className="py-3 px-4 font-mono text-text-secondary">11.44</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Formula
        display
        math="G = \frac{11.44}{15.92} = 0.719"
      />

      <p>
        The claim has a gradient of <strong>0.719</strong>, indicating moderate consensus toward TRUE.
        Note how the logarithmic weighting means Alice&apos;s high-reputation vote has more influence
        than Carol&apos;s, but not overwhelmingly so — this prevents any single user from dominating.
      </p>

      <h2>Consensus Thresholds</h2>

      <p>
        Claims are considered to have reached consensus when their gradient moves outside
        the uncertain zone:
      </p>

      <div className="not-prose my-6">
        <div className="relative h-8 bg-gradient-to-r from-accent-coral via-amber-500 to-emerald-500 rounded-lg overflow-hidden">
          <div className="absolute inset-y-0 left-[20%] w-px bg-white/50" />
          <div className="absolute inset-y-0 left-[80%] w-px bg-white/50" />
        </div>
        <div className="flex justify-between text-xs mt-2 text-text-muted">
          <span>0.0</span>
          <span>0.2</span>
          <span className="flex-1 text-center">Uncertain</span>
          <span>0.8</span>
          <span>1.0</span>
        </div>
        <div className="flex mt-1 text-xs font-medium">
          <div className="w-[20%] text-center text-accent-coral">FALSE</div>
          <div className="w-[60%] text-center text-amber-400">Contested</div>
          <div className="w-[20%] text-center text-emerald-400">TRUE</div>
        </div>
      </div>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Gradient Range</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-mono text-text-secondary">0.0 - 0.2</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2 text-text-primary">
                  <span className="w-3 h-3 rounded-full bg-accent-coral" />
                  Consensus FALSE
                </span>
              </td>
              <td className="py-3 px-4 text-text-muted">Community strongly believes claim is false</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-mono text-text-secondary">0.2 - 0.8</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2 text-text-primary">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  Uncertain / Contested
                </span>
              </td>
              <td className="py-3 px-4 text-text-muted">No clear consensus yet, more evidence needed</td>
            </tr>
            <tr className="border-b border-subtle">
              <td className="py-3 px-4 font-mono text-text-secondary">0.8 - 1.0</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-2 text-text-primary">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Consensus TRUE
                </span>
              </td>
              <td className="py-3 px-4 text-text-muted">Community strongly believes claim is true</td>
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
        code={`import math

def calculate_gradient(votes: List[Vote]) -> float:
    """Calculate weighted gradient from votes."""
    if not votes:
        return 0.5  # Neutral starting point

    weighted_sum = 0.0
    weight_total = 0.0

    for vote in votes:
        # Logarithmic weighting with minimum of 0.1
        weight = math.log(1 + max(0, vote.agent.reputation_score))
        if weight < 0.1:
            weight = 0.1
        weighted_sum += vote.value * weight
        weight_total += weight

    return weighted_sum / weight_total`}
        showLineNumbers
      />

      <h2>Edge Cases</h2>

      <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
        <div className="bg-dark-700 rounded-lg p-4 border border-subtle">
          <h4 className="font-semibold text-text-primary mb-2">No votes</h4>
          <p className="text-sm text-text-secondary">Claims start with a gradient of 0.5 (neutral)</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-subtle">
          <h4 className="font-semibold text-text-primary mb-2">Single vote</h4>
          <p className="text-sm text-text-secondary">Gradient equals the vote value</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-subtle">
          <h4 className="font-semibold text-text-primary mb-2">Zero reputation</h4>
          <p className="text-sm text-text-secondary">Still receives minimum weight of 0.1</p>
        </div>
      </div>

      <Callout type="note" title="Precision">
        Gradients are stored as floating-point numbers with full precision. Display rounding
        varies by context (typically 2 decimal places for UI).
      </Callout>
    </div>
  );
}
