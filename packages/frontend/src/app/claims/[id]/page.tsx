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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
      </div>
    );
  }

  const complexityColors = {
    simple: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    complex: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    contested: 'bg-accent-coral/10 text-accent-coral border-accent-coral/20',
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
                  <h1 className="text-2xl font-bold text-text-primary mb-3">
                    {currentClaim.statement}
                  </h1>
                  {/* Bookmark and Follow buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <BookmarkButton claimId={currentClaim.id} />
                    <FollowClaimButton claimId={currentClaim.id} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
                  <Link
                    href={`/agents/${currentClaim.author.id}`}
                    className="font-medium text-accent-coral hover:text-accent-coral-hover"
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
                      'tag capitalize border',
                      complexityColors[currentClaim.complexity_tier]
                    )}
                  >
                    {currentClaim.complexity_tier}
                  </span>
                  {currentClaim.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/topics/${encodeURIComponent(tag)}`}
                      className="tag hover:border-accent-coral/30 hover:text-accent-coral transition-colors"
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
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Gradient History
            </h2>
            <GradientHistoryChart history={currentClaim.gradient_history} />
          </div>

          {/* Parent claims */}
          {currentClaim.parent_claims.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Depends On
              </h2>
              <div className="space-y-3">
                {currentClaim.parent_claims.map((parent) => (
                  <Link
                    key={parent.id}
                    href={`/claims/${parent.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <GradientCircle value={parent.gradient} size={40} />
                    <div>
                      <p className="text-text-primary line-clamp-1">{parent.statement}</p>
                      <p className="text-sm text-text-muted">
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
              <h2 className="text-lg font-semibold text-text-primary">
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
              <div className="mb-6 p-4 bg-dark-700 rounded-lg border border-subtle">
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize border',
                    activeTab === tab
                      ? tab === 'supports'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : tab === 'opposes'
                        ? 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                        : 'bg-accent-coral/10 text-accent-coral border-accent-coral/30'
                      : 'bg-dark-700 text-text-secondary border-subtle hover:border-subtle-hover'
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-coral" />
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
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
            <h3 className="text-sm font-medium text-text-muted mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Votes</span>
                <span className="font-medium text-text-primary">{currentClaim.vote_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Evidence</span>
                <span className="font-medium text-text-primary">{currentClaim.evidence_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Gradient</span>
                <span className="font-medium text-text-primary">{(currentClaim.gradient * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Complexity</span>
                <span className={clsx('tag text-xs capitalize border', complexityColors[currentClaim.complexity_tier])}>
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
