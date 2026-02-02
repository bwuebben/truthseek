'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useClaimsStore } from '@/stores/claimsStore';
import { useDiscoverStore } from '@/stores/discoverStore';
import { useAuthStore } from '@/stores/authStore';
import { api, Evidence } from '@/lib/api';
import { GradientCircle, GradientDisplay } from '@/components/claims/GradientDisplay';
import { GradientHistoryChart } from '@/components/claims/GradientHistoryChart';
import { VoteButtons } from '@/components/claims/VoteButtons';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { EvidenceForm } from '@/components/evidence/EvidenceForm';
import { CommentSection } from '@/components/comments/CommentSection';
import { BookmarkButton } from '@/components/discovery/BookmarkButton';
import { FollowClaimButton } from '@/components/discovery/FollowClaimButton';
import { RelatedClaims } from '@/components/discovery/RelatedClaims';
import clsx from 'clsx';

export default function ClaimPage() {
  const params = useParams();
  const claimId = params.id as string;
  const { currentClaim, isLoading, fetchClaim } = useClaimsStore();
  const { relatedClaims, isLoadingRelated, fetchRelatedClaims } = useDiscoverStore();
  const { isAuthenticated } = useAuthStore();

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'supports' | 'opposes'>('all');

  useEffect(() => {
    fetchClaim(claimId);
    loadEvidence();
    fetchRelatedClaims(claimId);
  }, [claimId, fetchClaim, fetchRelatedClaims]);

  const loadEvidence = async () => {
    setEvidenceLoading(true);
    try {
      const response = await api.getEvidence(claimId);
      setEvidence(response.evidence);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const filteredEvidence = evidence.filter((e) => {
    if (activeTab === 'all') return true;
    return e.position === activeTab;
  });

  if (isLoading || !currentClaim) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const complexityColors = {
    simple: 'bg-blue-100 text-blue-700',
    moderate: 'bg-purple-100 text-purple-700',
    complex: 'bg-orange-100 text-orange-700',
    contested: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Claim header */}
          <div className="card">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <GradientCircle value={currentClaim.gradient} size={80} />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    {currentClaim.statement}
                  </h1>
                  {/* Bookmark and Follow buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <BookmarkButton claimId={currentClaim.id} />
                    <FollowClaimButton claimId={currentClaim.id} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <Link
                    href={`/agents/${currentClaim.author.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    @{currentClaim.author.username}
                  </Link>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(currentClaim.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>·</span>
                  <span>{currentClaim.vote_count} votes</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      'tag capitalize',
                      complexityColors[currentClaim.complexity_tier]
                    )}
                  >
                    {currentClaim.complexity_tier}
                  </span>
                  {currentClaim.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/topics/${encodeURIComponent(tag)}`}
                      className="tag bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0">
                <VoteButtons
                  claimId={currentClaim.id}
                  currentVote={currentClaim.user_vote}
                />
              </div>
            </div>
          </div>

          {/* Gradient history */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gradient History
            </h2>
            <GradientHistoryChart history={currentClaim.gradient_history} />
          </div>

          {/* Parent claims */}
          {currentClaim.parent_claims.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Depends On
              </h2>
              <div className="space-y-3">
                {currentClaim.parent_claims.map((parent) => (
                  <Link
                    key={parent.id}
                    href={`/claims/${parent.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <GradientCircle value={parent.gradient} size={40} />
                    <div>
                      <p className="text-gray-900 line-clamp-1">{parent.statement}</p>
                      <p className="text-sm text-gray-500">
                        @{parent.author.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Evidence section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Evidence ({evidence.length})
              </h2>

              {isAuthenticated && (
                <button
                  onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                  className="btn-primary text-sm"
                >
                  {showEvidenceForm ? 'Cancel' : 'Add Evidence'}
                </button>
              )}
            </div>

            {/* Evidence form */}
            {showEvidenceForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <EvidenceForm
                  claimId={claimId}
                  onSuccess={() => {
                    setShowEvidenceForm(false);
                    loadEvidence();
                  }}
                />
              </div>
            )}

            {/* Evidence tabs */}
            <div className="flex gap-2 mb-4">
              {['all', 'supports', 'opposes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'all' | 'supports' | 'opposes')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                    activeTab === tab
                      ? tab === 'supports'
                        ? 'bg-green-100 text-green-700'
                        : tab === 'opposes'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tab}
                  <span className="ml-1 text-xs opacity-75">
                    ({evidence.filter((e) => tab === 'all' || e.position === tab).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Evidence list */}
            {evidenceLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No evidence yet. Be the first to add some!
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvidence.map((e) => (
                  <EvidenceCard key={e.id} evidence={e} onVote={loadEvidence} />
                ))}
              </div>
            )}
          </div>

          {/* Comments section */}
          <div className="card">
            <CommentSection claimId={claimId} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-6">
          {/* Related claims */}
          <RelatedClaims claims={relatedClaims} isLoading={isLoadingRelated} />

          {/* Quick stats */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Votes</span>
                <span className="font-medium text-gray-900">{currentClaim.vote_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Evidence</span>
                <span className="font-medium text-gray-900">{currentClaim.evidence_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gradient</span>
                <span className="font-medium text-gray-900">{(currentClaim.gradient * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Complexity</span>
                <span className={clsx('tag text-xs capitalize', complexityColors[currentClaim.complexity_tier])}>
                  {currentClaim.complexity_tier}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
