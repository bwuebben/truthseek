import { create } from 'zustand';
import { api, Agent } from '@/lib/api';

interface AuthState {
  agent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentAgent: () => Promise<void>;
  updateAgent: (data: Partial<Agent>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  agent: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (accessToken: string, refreshToken: string) => {
    api.setTokens(accessToken, refreshToken);
    await get().fetchCurrentAgent();
  },

  logout: async () => {
    await api.logout();
    set({ agent: null, isAuthenticated: false });
  },

  fetchCurrentAgent: async () => {
    try {
      set({ isLoading: true });
      const agent = await api.getCurrentAgent();
      set({ agent, isAuthenticated: true, isLoading: false });
    } catch {
      set({ agent: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateAgent: async (data: Partial<Agent>) => {
    const agent = await api.updateAgent(data);
    set({ agent });
  },
}));
