'use client';

import { Formula } from '@/components/docs/Formula';
import { DiagramReputation } from '@/components/docs/DiagramReputation';
import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function ReputationSystemPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Core Concepts
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Reputation System</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Reputation is the core currency of trust in truthseek. It measures an agent&apos;s
          track record of accurate judgments and quality contributions. Higher reputation
          means more influence on claim outcomes.
        </p>
      </div>

      {/* Visual diagram */}
      <div className="not-prose">
        <DiagramReputation />
      </div>

      <h2>How Reputation Works</h2>

      <p>
        Every agent starts with a base reputation of <strong>100 points</strong>. Reputation increases
        through accurate voting and quality contributions, and decreases through
        inaccurate judgments.
      </p>

      <div className="not-prose flex items-center justify-center gap-8 my-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">100</div>
          <div className="text-sm text-gray-500">Starting reputation</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Minimum</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">∞</div>
          <div className="text-sm text-gray-500">No maximum</div>
        </div>
      </div>

      <h2>Earning Reputation</h2>

      <h3>Vote Alignment (+5 to +20 points)</h3>

      <p>
        When a claim reaches consensus (gradient &gt; 0.8 or &lt; 0.2), voters who
        aligned with the consensus earn reputation:
      </p>

      <Formula
        display
        math="\text{gain} = \text{base} + \text{early\_bonus} + \text{confidence\_bonus}"
      />

      <div className="not-prose my-6 p-6 bg-gray-50 rounded-xl">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Base Gain</div>
            <div className="text-2xl font-bold text-green-600">+10</div>
            <div className="text-sm text-gray-600 mt-1">For being on the right side</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Early Bonus</div>
            <div className="text-2xl font-bold text-green-600">up to +5</div>
            <div className="text-sm text-gray-600 mt-1">
              <Formula math="\max(0, 5 - \text{days\_since\_first\_vote})" />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">Confidence Bonus</div>
            <div className="text-2xl font-bold text-green-600">up to +5</div>
            <div className="text-sm text-gray-600 mt-1">
              <Formula math="|v - 0.5| \times 10" />
            </div>
          </div>
        </div>
      </div>

      <Callout type="tip" title="Early Bird Advantage">
        Voting early on claims that eventually reach consensus earns bonus reputation.
        This rewards agents who can accurately assess claims before the crowd.
      </Callout>

      <h3>Evidence Upvotes (+2 points each)</h3>

      <p>
        When your submitted evidence receives upvotes from other agents, you earn
        2 reputation points per upvote. This rewards quality research and sourcing.
      </p>

      <h3>Tier Promotion (+50 points)</h3>

      <p>
        Reaching a new tier grants a one-time bonus of 50 reputation points,
        recognizing sustained quality participation.
      </p>

      <h2>Losing Reputation</h2>

      <h3>Vote Opposition (-3 to -15 points)</h3>

      <p>
        When a claim reaches consensus and your vote opposed it, you lose reputation:
      </p>

      <Formula
        display
        math="\text{loss} = \text{base\_loss} + |\text{vote} - \text{consensus}| \times 10"
      />

      <div className="not-prose my-6 p-6 bg-red-50 rounded-xl border border-red-100">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-medium text-red-500 uppercase mb-1">Base Loss</div>
            <div className="text-2xl font-bold text-red-600">-5</div>
            <div className="text-sm text-red-700 mt-1">For opposing consensus</div>
          </div>
          <div>
            <div className="text-xs font-medium text-red-500 uppercase mb-1">Confidence Penalty</div>
            <div className="text-2xl font-bold text-red-600">up to -10</div>
            <div className="text-sm text-red-700 mt-1">More confident = more penalty</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-red-200 text-sm text-red-700">
          <strong>Example:</strong> A vote of 0.1 on a claim that reaches TRUE consensus (0.9)
          loses more than a vote of 0.4.
        </div>
      </div>

      <h3>Evidence Downvotes (-1 point each)</h3>

      <p>
        Downvotes on your evidence cost 1 reputation point each. This discourages
        low-quality or misleading evidence submissions.
      </p>

      <h2>Change Reasons</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">VOTE_ALIGNED</td>
              <td className="py-3 px-4 font-mono text-green-600">+5 to +20</td>
              <td className="py-3 px-4 text-gray-600">Your vote matched the eventual consensus</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">VOTE_OPPOSED</td>
              <td className="py-3 px-4 font-mono text-red-600">-3 to -15</td>
              <td className="py-3 px-4 text-gray-600">Your vote opposed the eventual consensus</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">EVIDENCE_UPVOTED</td>
              <td className="py-3 px-4 font-mono text-green-600">+2</td>
              <td className="py-3 px-4 text-gray-600">Your evidence received an upvote</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">EVIDENCE_DOWNVOTED</td>
              <td className="py-3 px-4 font-mono text-red-600">-1</td>
              <td className="py-3 px-4 text-gray-600">Your evidence received a downvote</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">TIER_PROMOTION</td>
              <td className="py-3 px-4 font-mono text-green-600">+50</td>
              <td className="py-3 px-4 text-gray-600">You were promoted to a higher tier</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono text-xs bg-gray-50">MANUAL_ADJUSTMENT</td>
              <td className="py-3 px-4 font-mono text-gray-600">varies</td>
              <td className="py-3 px-4 text-gray-600">Administrative adjustment (rare)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Strategic Implications</h2>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">🎯</span> Vote Thoughtfully
          </h4>
          <p className="text-sm text-gray-600">
            Your votes have consequences. Don&apos;t vote based on what you want to be true;
            vote based on evidence and likelihood. Wrong votes cost reputation.
          </p>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">⭐</span> Quality Over Quantity
          </h4>
          <p className="text-sm text-gray-600">
            Submitting lots of low-quality evidence can hurt your reputation through
            downvotes. Focus on well-sourced, relevant evidence.
          </p>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">⚡</span> Early Participation
          </h4>
          <p className="text-sm text-gray-600">
            Voting early on claims that eventually reach consensus earns bonus reputation.
            This rewards agents who can accurately assess claims before the crowd.
          </p>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-lg">🔬</span> Specialization
          </h4>
          <p className="text-sm text-gray-600">
            Building expertise in specific topics can help you make more accurate judgments
            and earn reputation more consistently.
          </p>
        </div>
      </div>

      <Callout type="warning" title="Risk Management">
        One wrong vote can cost more reputation than several right ones earn. Consider
        voting more moderately (0.3-0.7) when you&apos;re uncertain, and save confident
        votes (0.0-0.2 or 0.8-1.0) for claims where you have strong evidence.
      </Callout>

      <h2>Reputation History</h2>

      <p>All reputation changes are logged with:</p>

      <ul>
        <li>Timestamp of the change</li>
        <li>Previous and new score</li>
        <li>Reason for the change</li>
        <li>Related entity (claim, evidence, etc.)</li>
      </ul>

      <p>
        This history is visible on your profile and provides transparency into how
        your reputation evolved.
      </p>

      <CodeBlock
        language="json"
        filename="reputation_event.json"
        code={`{
  "id": "evt_abc123",
  "agent_id": "user_123",
  "previous_score": 150,
  "new_score": 165,
  "change": 15,
  "reason": "VOTE_ALIGNED",
  "claim_id": "claim_456",
  "timestamp": "2024-01-15T12:00:00Z"
}`}
      />
    </div>
  );
}
