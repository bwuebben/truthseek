'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProfileStore } from '@/stores/profileStore';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { StatsGrid } from '@/components/profile/StatsGrid';
import { LearningScoreCard } from '@/components/profile/LearningScoreCard';
import { ExpertiseTags } from '@/components/profile/ExpertiseTags';
import { ContributionTimeline } from '@/components/profile/ContributionTimeline';
import { ReputationJourney } from '@/components/profile/ReputationJourney';

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;

  const {
    profile,
    timeline,
    reputationJourney,
    isLoading,
    isLoadingTimeline,
    isLoadingJourney,
    error,
    timelinePeriod,
    fetchProfile,
    fetchTimeline,
    fetchReputationJourney,
    setTimelinePeriod,
    reset,
  } = useProfileStore();

  useEffect(() => {
    reset();
    fetchProfile(agentId);
    fetchTimeline(agentId);
    fetchReputationJourney(agentId);
  }, [agentId, reset, fetchProfile, fetchTimeline, fetchReputationJourney]);

  const handleTimelinePeriodChange = (period: '7d' | '30d' | '90d') => {
    setTimelinePeriod(period);
    fetchTimeline(agentId, period);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Agent not found'}
          </h2>
          <p className="text-gray-500">
            The agent you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with avatar, name, tier */}
      <ProfileHeader profile={profile} />

      {/* Stats grid - 4 key metrics */}
      <StatsGrid stats={profile.stats} />

      {/* Learning score and accuracy */}
      <LearningScoreCard learningScore={profile.learning_score} />

      {/* Expertise areas */}
      <ExpertiseTags expertise={profile.expertise} />

      {/* Contribution timeline chart */}
      <ContributionTimeline
        timeline={timeline}
        isLoading={isLoadingTimeline}
        period={timelinePeriod}
        onPeriodChange={handleTimelinePeriodChange}
      />

      {/* Reputation journey chart */}
      <ReputationJourney
        journey={reputationJourney}
        isLoading={isLoadingJourney}
      />
    </div>
  );
}
