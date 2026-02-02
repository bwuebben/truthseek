'use client';

import Link from 'next/link';
import { RelatedClaim } from '@/lib/api';
import { GradientDisplay } from '@/components/claims/GradientDisplay';

interface RelatedClaimsProps {
  claims: RelatedClaim[];
  isLoading: boolean;
}

export function RelatedClaims({ claims, isLoading }: RelatedClaimsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500">Related Claims</h3>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (claims.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500">Related Claims</h3>
      {claims.map((claim) => (
        <Link
          key={claim.id}
          href={`/claims/${claim.id}`}
          className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-start gap-2">
            <GradientDisplay value={claim.gradient} variant="circle" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 line-clamp-2">
                {claim.statement}
              </p>
              {claim.shared_tags.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {claim.shared_tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
