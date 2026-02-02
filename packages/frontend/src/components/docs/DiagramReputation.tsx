'use client';

export function DiagramReputation() {
  const gains = [
    { action: 'Vote aligned with consensus', points: '+5 to +20', color: 'bg-green-500' },
    { action: 'Evidence upvoted', points: '+2', color: 'bg-green-400' },
    { action: 'Tier promotion bonus', points: '+50', color: 'bg-green-600' },
  ];

  const losses = [
    { action: 'Vote opposed consensus', points: '-3 to -15', color: 'bg-red-500' },
    { action: 'Evidence downvoted', points: '-1', color: 'bg-red-400' },
  ];

  return (
    <div className="my-8 grid md:grid-cols-2 gap-6">
      {/* Gains */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h4 className="font-semibold text-green-900">Earning Reputation</h4>
        </div>
        <div className="space-y-3">
          {gains.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.action}</span>
              <span className={`${item.color} text-white text-xs font-mono font-medium px-2 py-1 rounded`}>
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Losses */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <h4 className="font-semibold text-red-900">Losing Reputation</h4>
        </div>
        <div className="space-y-3">
          {losses.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.action}</span>
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
