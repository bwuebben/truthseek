'use client';

export function DiagramTiers() {
  const tiers = [
    { name: 'New', range: '0-199', color: 'from-gray-100 to-gray-200', border: 'border-gray-300', icon: '🌱', weight: '1.0x' },
    { name: 'Established', range: '200-499', color: 'from-blue-100 to-blue-200', border: 'border-blue-300', icon: '⭐', weight: '2.0-5.0x' },
    { name: 'Trusted', range: '500+', color: 'from-amber-100 to-yellow-200', border: 'border-yellow-400', icon: '👑', weight: '5.0x+' },
  ];

  return (
    <div className="my-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="h-4 rounded-full bg-gradient-to-r from-gray-200 via-blue-200 to-yellow-200 shadow-inner" />

        {/* Markers */}
        <div className="absolute inset-x-0 top-0 flex">
          <div className="w-[40%] flex justify-end">
            <div className="w-1 h-4 bg-gray-400 rounded" />
          </div>
          <div className="w-[20%] flex justify-end">
            <div className="w-1 h-4 bg-blue-400 rounded" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex mt-2 text-xs text-gray-500 font-medium">
          <div className="w-[40%] text-center">0</div>
          <div className="w-[20%] text-center">200</div>
          <div className="w-[40%] text-center">500+</div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-4 rounded-xl bg-gradient-to-br ${tier.color} border ${tier.border} shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{tier.name}</div>
                <div className="text-xs text-gray-600">{tier.range} reputation</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Vote weight</span>
              <span className="font-mono font-medium text-gray-900">{tier.weight}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
