'use client';

export function DiagramGradient() {
  return (
    <div className="my-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {/* Input: Votes */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Votes</div>
          <div className="flex gap-2">
            {[0.9, 0.8, 0.3].map((v, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-mono font-medium"
                style={{
                  background: `linear-gradient(135deg, ${v > 0.5 ? '#dcfce7' : '#fee2e2'}, ${v > 0.5 ? '#bbf7d0' : '#fecaca'})`,
                  color: v > 0.5 ? '#166534' : '#991b1b',
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>

        {/* Weights */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weights</div>
          <div className="flex gap-2">
            {[8.0, 2.0, 1.0].map((w, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-sm font-mono font-medium text-blue-700"
              >
                {w}x
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>

        {/* Output: Gradient */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gradient</div>
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-xl font-mono font-bold shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
            }}
          >
            0.83
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-8 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span>Support ({">"} 0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span>Oppose ({"<"} 0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span>Weight from reputation</span>
        </div>
      </div>
    </div>
  );
}
