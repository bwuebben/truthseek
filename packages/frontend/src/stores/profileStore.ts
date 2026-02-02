import { create } from 'zustand';
import {
  api,
  ProfileResponse,
  TimelineResponse,
  AccuracyHistoryResponse,
  ReputationJourneyResponse,
} from '@/lib/api';

interface ProfileState {
  profile: ProfileResponse | null;
  timeline: TimelineResponse | null;
  accuracyHistory: AccuracyHistoryResponse | null;
  reputationJourney: ReputationJourneyResponse | null;
  isLoading: boolean;
  isLoadingTimeline: boolean;
  isLoadingAccuracy: boolean;
  isLoadingJourney: boolean;
  error: string | null;
  timelinePeriod: '7d' | '30d' | '90d';
  accuracyPeriod: '7d' | '30d' | '90d';

  // Actions
  fetchProfile: (agentId: string) => Promise<void>;
  fetchTimeline: (agentId: string, period?: '7d' | '30d' | '90d') => Promise<void>;
  fetchAccuracyHistory: (agentId: string, period?: '7d' | '30d' | '90d') => Promise<void>;
  fetchReputationJourney: (agentId: string) => Promise<void>;
  setTimelinePeriod: (period: '7d' | '30d' | '90d') => void;
  setAccuracyPeriod: (period: '7d' | '30d' | '90d') => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  timeline: null,
  accuracyHistory: null,
  reputationJourney: null,
  isLoading: false,
  isLoadingTimeline: false,
  isLoadingAccuracy: false,
  isLoadingJourney: false,
  error: null,
  timelinePeriod: '30d',
  accuracyPeriod: '30d',

  fetchProfile: async (agentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await api.getProfile(agentId);
      set({ profile, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  fetchTimeline: async (agentId: string, period?: '7d' | '30d' | '90d') => {
    const targetPeriod = period || get().timelinePeriod;
    set({ isLoadingTimeline: true });
    try {
      const timeline = await api.getProfileTimeline(agentId, targetPeriod);
      set({ timeline, isLoadingTimeline: false, timelinePeriod: targetPeriod });
    } catch (error) {
      set({ isLoadingTimeline: false });
      throw error;
    }
  },

  fetchAccuracyHistory: async (agentId: string, period?: '7d' | '30d' | '90d') => {
    const targetPeriod = period || get().accuracyPeriod;
    set({ isLoadingAccuracy: true });
    try {
      const accuracyHistory = await api.getAccuracyHistory(agentId, targetPeriod);
      set({ accuracyHistory, isLoadingAccuracy: false, accuracyPeriod: targetPeriod });
    } catch (error) {
      set({ isLoadingAccuracy: false });
      throw error;
    }
  },

  fetchReputationJourney: async (agentId: string) => {
    set({ isLoadingJourney: true });
    try {
      const reputationJourney = await api.getReputationJourney(agentId);
      set({ reputationJourney, isLoadingJourney: false });
    } catch (error) {
      set({ isLoadingJourney: false });
      throw error;
    }
  },

  setTimelinePeriod: (period: '7d' | '30d' | '90d') => {
    set({ timelinePeriod: period });
  },

  setAccuracyPeriod: (period: '7d' | '30d' | '90d') => {
    set({ accuracyPeriod: period });
  },

  reset: () => {
    set({
      profile: null,
      timeline: null,
      accuracyHistory: null,
      reputationJourney: null,
      isLoading: false,
      isLoadingTimeline: false,
      isLoadingAccuracy: false,
      isLoadingJourney: false,
      error: null,
    });
  },
}));
