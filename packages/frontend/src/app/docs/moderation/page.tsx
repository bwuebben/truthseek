'use client';

import { Callout } from '@/components/docs/Callout';

export default function ModerationPage() {
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
        <h1 className="text-3xl font-bold text-text-primary mb-4">Moderation</h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          truthseek uses a distributed moderation system where the community plays an
          active role in maintaining quality. This page explains how moderation works,
          who can participate, and what actions are available.
        </p>
      </div>

      <h2>Philosophy</h2>

      <Callout type="info" title="Process, Not Viewpoint">
        Moderation focuses on process integrity, not viewpoint. We don&apos;t moderate
        claims for being &quot;wrong&quot; — that&apos;s what the gradient system is for.
        Moderation addresses guideline violations, bad-faith manipulation, and harmful content.
      </Callout>

      <h2>Who Can Moderate</h2>

      <div className="not-prose my-8 space-y-4">
        {[
          {
            tier: 'All Users',
            icon: '👤',
            color: 'gray',
            abilities: ['Upvote/downvote evidence and comments', 'Report obvious violations via support'],
          },
          {
            tier: 'Established (200+)',
            icon: '⭐',
            color: 'cyan',
            abilities: ['Flag content for moderation review', 'Access flagged content queue (view only)'],
          },
          {
            tier: 'Trusted (500+)',
            icon: '👑',
            color: 'amber',
            abilities: ['All Established abilities', 'Hide/unhide low-quality evidence', 'Vote on flagged content disposition', 'Priority in dispute resolution'],
          },
          {
            tier: 'Platform Moderators',
            icon: '🛡️',
            color: 'coral',
            abilities: ['Final authority on content decisions', 'Account suspension/ban', 'Handle appeals', 'Address edge cases'],
          },
        ].map((item) => (
          <div
            key={item.tier}
            className={`p-5 rounded-xl border ${
              item.color === 'gray' ? 'bg-dark-700 border-subtle' :
              item.color === 'cyan' ? 'bg-accent-cyan/10 border-accent-cyan/30' :
              item.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-accent-coral/10 border-accent-coral/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold text-text-primary">{item.tier}</h3>
            </div>
            <ul className="space-y-1 text-sm text-text-secondary">
              {item.abilities.map((ability, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  {ability}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>Flagging Content</h2>

      <h3>What Can Be Flagged</h3>

      <div className="not-prose flex flex-wrap gap-3 my-6">
        {['Claims', 'Evidence', 'Comments', 'User profiles'].map((item) => (
          <div key={item} className="px-4 py-2 bg-dark-700 rounded-lg text-sm font-medium text-text-primary border border-subtle">
            {item}
          </div>
        ))}
      </div>

      <h3>Flag Reasons</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Reason</th>
              <th className="text-left py-3 px-4 font-semibold text-text-secondary">Use For</th>
            </tr>
          </thead>
          <tbody>
            {[
              { reason: 'Spam', use: 'Promotional content, repetitive posts, bots' },
              { reason: 'Harassment', use: 'Personal attacks, threats, bullying' },
              { reason: 'Misinformation', use: 'Deliberately false evidence, fabricated sources' },
              { reason: 'Off-topic', use: 'Content unrelated to the claim' },
              { reason: 'Low quality', use: 'Unhelpful, unclear, or poorly sourced' },
              { reason: 'Manipulation', use: 'Coordinated voting, sockpuppets' },
              { reason: 'Illegal', use: 'Content that violates laws' },
              { reason: 'Other', use: 'Explain in the flag description' },
            ].map((item) => (
              <tr key={item.reason} className="border-b border-subtle">
                <td className="py-3 px-4 font-medium text-text-primary">{item.reason}</td>
                <td className="py-3 px-4 text-text-secondary">{item.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>How to Flag</h3>

      <div className="not-prose my-6">
        <ol className="space-y-3">
          {[
            'Click the flag icon on the content',
            'Select the most appropriate reason',
            'Add a brief explanation (required)',
            'Submit the flag',
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-4 p-3 bg-dark-700 rounded-lg border border-subtle">
              <div className="w-8 h-8 bg-accent-coral text-dark-900 rounded-full flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <span className="text-text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <Callout type="warning" title="Flag Responsibly">
        Frivolous or abusive flags may result in flag privileges being revoked.
        Only flag content that genuinely violates guidelines.
      </Callout>

      <h2>Moderation Queue</h2>

      <p>Flagged content enters a moderation queue where it&apos;s reviewed:</p>

      <div className="not-prose my-8">
        <div className="relative">
          {[
            { stage: 'Triage', desc: 'Content categorized by severity and type' },
            { stage: 'Review', desc: 'Trusted users and moderators examine content' },
            { stage: 'Decision', desc: 'Content approved or action taken' },
            { stage: 'Notification', desc: 'Flagger and author notified of outcome' },
          ].map((item, i) => (
            <div key={item.stage} className="flex items-start gap-4 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-accent-coral text-dark-900 rounded-full flex items-center justify-center font-bold">
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className="absolute left-5 top-10 w-0.5 h-6 bg-accent-coral/30" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-text-primary">{item.stage}</h4>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3>Queue Priorities</h3>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          { priority: 'Urgent', color: 'coral', items: ['Illegal content', 'Threats', 'Doxxing'] },
          { priority: 'High', color: 'orange', items: ['Harassment', 'Manipulation attempts'] },
          { priority: 'Normal', color: 'amber', items: ['Misinformation', 'Spam', 'Low quality'] },
          { priority: 'Low', color: 'gray', items: ['Off-topic', 'Minor issues'] },
        ].map((item) => (
          <div
            key={item.priority}
            className={`p-4 rounded-lg border ${
              item.color === 'coral' ? 'bg-accent-coral/10 border-accent-coral/30' :
              item.color === 'orange' ? 'bg-orange-500/10 border-orange-500/30' :
              item.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-dark-700 border-subtle'
            }`}
          >
            <h4 className={`font-semibold mb-2 ${
              item.color === 'coral' ? 'text-accent-coral' :
              item.color === 'orange' ? 'text-orange-400' :
              item.color === 'amber' ? 'text-amber-400' :
              'text-text-primary'
            }`}>
              {item.priority}
            </h4>
            <ul className="text-sm space-y-1">
              {item.items.map((i) => (
                <li key={i} className="text-text-secondary">• {i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>Actions</h2>

      <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
        <div className="p-5 bg-dark-700 rounded-xl border border-subtle">
          <h4 className="font-semibold text-text-primary mb-3">Content Actions</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Dismiss flag:</strong> No violation found</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400">⚠</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Hide:</strong> Content collapsed but accessible</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-coral">✕</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Remove:</strong> Content deleted</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-cyan">✎</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Edit:</strong> Remove problematic portion (rare)</span>
            </li>
          </ul>
        </div>
        <div className="p-5 bg-dark-700 rounded-xl border border-subtle">
          <h4 className="font-semibold text-text-primary mb-3">Account Actions</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-amber-400">⚠</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Warning:</strong> Notification of violation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">⊘</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Restriction:</strong> Temporary limit on actions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent-coral">⏸</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Suspension:</strong> Temporary account lockout</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-500">⛔</span>
              <span className="text-text-secondary"><strong className="text-text-primary">Ban:</strong> Permanent removal</span>
            </li>
          </ul>
        </div>
      </div>

      <h2>Appeals</h2>

      <h3>How to Appeal</h3>

      <div className="not-prose my-6">
        <ol className="space-y-3">
          {[
            'Go to your notification about the action',
            'Click "Appeal this decision"',
            'Explain why you believe the action was incorrect',
            'Provide any relevant context or evidence',
            'Submit the appeal',
          ].map((step, i) => (
            <li key={i} className="flex items-center gap-4 p-3 bg-accent-cyan/10 rounded-lg border border-accent-cyan/30">
              <div className="w-8 h-8 bg-accent-cyan text-dark-900 rounded-full flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <span className="text-text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="not-prose my-6 p-5 bg-dark-700 rounded-xl border border-subtle">
        <h4 className="font-semibold text-text-primary mb-3">Appeal Process</h4>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>• Appeals reviewed by platform moderators (not original reviewer)</li>
          <li>• Response within 72 hours</li>
          <li>• Moderator&apos;s decision is final</li>
          <li>• Repeated frivolous appeals may be ignored</li>
        </ul>
      </div>

      <h2>Manipulation Detection</h2>

      <p>The platform employs automated systems to detect manipulation:</p>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          { icon: '📊', title: 'Vote pattern analysis', desc: 'Identifies coordinated voting' },
          { icon: '👥', title: 'Account clustering', desc: 'Detects sockpuppet networks' },
          { icon: '⏱️', title: 'Timing analysis', desc: 'Spots suspicious activity bursts' },
          { icon: '🔍', title: 'Content fingerprinting', desc: 'Identifies copied/duplicate content' },
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

      <p>
        Detected manipulation results in vote nullification, reputation penalties,
        and potential account suspension.
      </p>

      <h2>Being a Good Moderator</h2>

      <p>As you progress to Trusted tier and gain moderation abilities:</p>

      <div className="not-prose my-6 grid md:grid-cols-2 gap-4">
        {[
          { principle: 'Be fair', desc: 'Evaluate content objectively, regardless of your views' },
          { principle: 'Be consistent', desc: 'Apply guidelines uniformly' },
          { principle: 'Be measured', desc: 'Use the minimum action necessary' },
          { principle: 'Be patient', desc: 'New users may not know all the norms' },
        ].map((item) => (
          <div key={item.principle} className="p-4 bg-accent-cyan/10 rounded-lg border border-accent-cyan/30">
            <h4 className="font-semibold text-text-primary">{item.principle}</h4>
            <p className="text-sm text-text-secondary mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <Callout type="success" title="Thank You">
        Good moderation protects the platform&apos;s ability to function as a
        truth-seeking system. Thank you for helping maintain this community.
      </Callout>
    </div>
  );
}
