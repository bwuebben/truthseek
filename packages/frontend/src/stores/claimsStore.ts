import { create } from 'zustand';
import { api, Claim, ClaimSearchParams, ClaimWithHistory } from '@/lib/api';

interface ClaimsState {
  claims: Claim[];
  currentClaim: ClaimWithHistory | null;
  total: number;
  isLoading: boolean;
  searchParams: ClaimSearchParams;

  // Actions
  fetchClaims: (params?: ClaimSearchParams) => Promise<void>;
  fetchClaim: (id: string) => Promise<void>;
  createClaim: (statement: string, options?: Partial<ClaimSearchParams>) => Promise<Claim>;
  voteOnClaim: (claimId: string, value: number) => Promise<void>;
  removeVote: (claimId: string) => Promise<void>;
  setSearchParams: (params: ClaimSearchParams) => void;
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: [],
  currentClaim: null,
  total: 0,
  isLoading: false,
  searchParams: {
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 20,
    offset: 0,
  },

  fetchClaims: async (params?: ClaimSearchParams) => {
    set({ isLoading: true });
    const searchParams = { ...get().searchParams, ...params };
    try {
      const response = await api.getClaims(searchParams);
      set({
        claims: response.claims,
        total: response.total,
        searchParams,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchClaim: async (id: string) => {
    set({ isLoading: true, currentClaim: null });
    try {
      const claim = await api.getClaim(id);
      set({ currentClaim: claim, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createClaim: async (statement: string, options = {}) => {
    const claim = await api.createClaim({ statement, ...options });
    // Refresh claims list
    get().fetchClaims();
    return claim;
  },

  voteOnClaim: async (claimId: string, value: number) => {
    const updatedClaim = await api.voteOnClaim(claimId, value);

    // Update in claims list
    set((state) => ({
      claims: state.claims.map((c) =>
        c.id === claimId ? { ...c, ...updatedClaim } : c
      ),
      currentClaim:
        state.currentClaim?.id === claimId
          ? { ...state.currentClaim, ...updatedClaim }
          : state.currentClaim,
    }));
  },

  removeVote: async (claimId: string) => {
    await api.removeClaimVote(claimId);

    // Update in claims list
    set((state) => ({
      claims: state.claims.map((c) =>
        c.id === claimId ? { ...c, user_vote: null } : c
      ),
      currentClaim:
        state.currentClaim?.id === claimId
          ? { ...state.currentClaim, user_vote: null }
          : state.currentClaim,
    }));
  },

  setSearchParams: (params: ClaimSearchParams) => {
    set({ searchParams: { ...get().searchParams, ...params } });
  },
}));
