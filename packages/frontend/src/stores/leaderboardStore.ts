import { create } from 'zustand';
import { api, LeaderboardEntry, AgentRankResponse, LeaderboardParams } from '@/lib/api';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  total: number;
  period: 'all_time' | 'monthly' | 'weekly';
  updatedAt: string | null;
  isLoading: boolean;
  myRank: AgentRankResponse | null;
  params: LeaderboardParams;

  // Actions
  fetchLeaderboard: (params?: LeaderboardParams) => Promise<void>;
  fetchMyRank: () => Promise<void>;
  setPeriod: (period: 'all_time' | 'monthly' | 'weekly') => void;
  setParams: (params: LeaderboardParams) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  total: 0,
  period: 'all_time',
  updatedAt: null,
  isLoading: false,
  myRank: null,
  params: {
    limit: 50,
    offset: 0,
    period: 'all_time',
  },

  fetchLeaderboard: async (params?: LeaderboardParams) => {
    set({ isLoading: true });
    const queryParams = { ...get().params, ...params };

    try {
      const response = await api.getLeaderboard(queryParams);
      set({
        entries: response.entries,
        total: response.total,
        period: response.period,
        updatedAt: response.updated_at,
        params: queryParams,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMyRank: async () => {
    try {
      const rank = await api.getMyRank();
      set({ myRank: rank });
    } catch {
      set({ myRank: null });
    }
  },

  setPeriod: (period: 'all_time' | 'monthly' | 'weekly') => {
    const { fetchLeaderboard } = get();
    set({ period });
    fetchLeaderboard({ period, offset: 0 });
  },

  setParams: (params: LeaderboardParams) => {
    set((state) => ({
      params: { ...state.params, ...params },
    }));
  },
}));
