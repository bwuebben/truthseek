'use client';

export function DiagramGradient() {
  return (
    <div className="my-8 p-6 bg-dark-800 rounded-xl border border-subtle">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {/* Input: Votes */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Votes</div>
          <div className="flex gap-2">
            {[0.9, 0.8, 0.3].map((v, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-mono font-medium border"
                style={{
                  background: v > 0.5 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                  borderColor: v > 0.5 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 77, 77, 0.3)',
                  color: v > 0.5 ? '#10b981' : '#ff4d4d',
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>

        {/* Weights */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Weights</div>
          <div className="flex gap-2">
            {[8.0, 2.0, 1.0].map((w, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg bg-accent-coral/10 border border-accent-coral/30 flex items-center justify-center text-sm font-mono font-medium text-accent-coral"
              >
                {w}x
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>

        {/* Output: Gradient */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Gradient</div>
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-xl font-mono font-bold shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            }}
          >
            0.83
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-6 pt-4 border-t border-subtle flex justify-center gap-8 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
          <span>Support ({">"} 0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent-coral/20 border border-accent-coral/30" />
          <span>Oppose ({"<"} 0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent-coral/20 border border-accent-coral/30" />
          <span>Weight from reputation</span>
        </div>
      </div>
    </div>
  );
}
