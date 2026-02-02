'use client';

export function DiagramTiers() {
  const tiers = [
    { name: 'New', range: '0-199', bgColor: 'bg-dark-700', borderColor: 'border-subtle', icon: '🌱', weight: '1.0x', textColor: 'text-text-secondary' },
    { name: 'Established', range: '200-499', bgColor: 'bg-accent-cyan/10', borderColor: 'border-accent-cyan/30', icon: '⭐', weight: '2.0-5.0x', textColor: 'text-accent-cyan' },
    { name: 'Trusted', range: '500+', bgColor: 'bg-accent-coral/10', borderColor: 'border-accent-coral/30', icon: '👑', weight: '5.0x+', textColor: 'text-accent-coral' },
  ];

  return (
    <div className="my-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="h-4 rounded-full bg-gradient-to-r from-dark-600 via-accent-cyan/30 to-accent-coral/30 shadow-inner" />

        {/* Markers */}
        <div className="absolute inset-x-0 top-0 flex">
          <div className="w-[40%] flex justify-end">
            <div className="w-1 h-4 bg-text-muted rounded" />
          </div>
          <div className="w-[20%] flex justify-end">
            <div className="w-1 h-4 bg-accent-cyan rounded" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex mt-2 text-xs text-text-muted font-medium">
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
            className={`p-4 rounded-xl ${tier.bgColor} border ${tier.borderColor}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <div className={`font-semibold ${tier.textColor}`}>{tier.name}</div>
                <div className="text-xs text-text-muted">{tier.range} reputation</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Vote weight</span>
              <span className={`font-mono font-medium ${tier.textColor}`}>{tier.weight}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
