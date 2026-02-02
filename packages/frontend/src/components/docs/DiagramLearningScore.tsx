'use client';

export function DiagramLearningScore() {
  const components = [
    { name: 'Accuracy', weight: 50, color: 'from-accent-coral to-red-500', description: 'Correct votes / Total resolved votes' },
    { name: 'Consistency', weight: 25, color: 'from-accent-cyan to-teal-500', description: 'Low variance over time' },
    { name: 'Improvement', weight: 25, color: 'from-emerald-400 to-emerald-500', description: 'Positive accuracy trend' },
  ];

  return (
    <div className="my-8 bg-dark-800 rounded-xl border border-subtle overflow-hidden">
      {/* Pie chart visualization */}
      <div className="p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-40 h-40 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Accuracy - 50% */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#gradient-accuracy)"
              strokeWidth="20"
              strokeDasharray="125.6 125.6"
              strokeDashoffset="0"
            />
            {/* Consistency - 25% */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#gradient-consistency)"
              strokeWidth="20"
              strokeDasharray="62.8 188.4"
              strokeDashoffset="-125.6"
            />
            {/* Improvement - 25% */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#gradient-improvement)"
              strokeWidth="20"
              strokeDasharray="62.8 188.4"
              strokeDashoffset="-188.4"
            />
            <defs>
              <linearGradient id="gradient-accuracy" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="100%" stopColor="#e63946" />
              </linearGradient>
              <linearGradient id="gradient-consistency" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5cc" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
              <linearGradient id="gradient-improvement" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">0.72</div>
              <div className="text-xs text-text-muted">Score</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4">
          {components.map((comp) => (
            <div key={comp.name} className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded bg-gradient-to-r ${comp.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{comp.name}</span>
                  <span className="text-sm font-mono text-text-muted">{comp.weight}%</span>
                </div>
                <p className="text-xs text-text-muted">{comp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score interpretation */}
      <div className="bg-dark-700 px-6 py-4 border-t border-subtle">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-text-muted">0.8-1.0 Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan" />
            <span className="text-text-muted">0.65-0.8 Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-text-muted">0.5-0.65 Developing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-coral" />
            <span className="text-text-muted">{"<"}0.5 Needs work</span>
          </div>
        </div>
      </div>
    </div>
  );
}
