'use client';

export function DiagramReputation() {
  const gains = [
    { action: 'Vote aligned with consensus', points: '+5 to +20', color: 'bg-emerald-500' },
    { action: 'Evidence upvoted', points: '+2', color: 'bg-emerald-400' },
    { action: 'Tier promotion bonus', points: '+50', color: 'bg-emerald-600' },
  ];

  const losses = [
    { action: 'Vote opposed consensus', points: '-3 to -15', color: 'bg-accent-coral' },
    { action: 'Evidence downvoted', points: '-1', color: 'bg-red-400' },
  ];

  return (
    <div className="my-8 grid md:grid-cols-2 gap-6">
      {/* Gains */}
      <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/30">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h4 className="font-semibold text-emerald-400">Earning Reputation</h4>
        </div>
        <div className="space-y-3">
          {gains.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{item.action}</span>
              <span className={`${item.color} text-white text-xs font-mono font-medium px-2 py-1 rounded`}>
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Losses */}
      <div className="bg-accent-coral/10 rounded-xl p-5 border border-accent-coral/30">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-accent-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <h4 className="font-semibold text-accent-coral">Losing Reputation</h4>
        </div>
        <div className="space-y-3">
          {losses.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{item.action}</span>
              <span className={`${item.color} text-white text-xs font-mono font-medium px-2 py-1 rounded`}>
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
