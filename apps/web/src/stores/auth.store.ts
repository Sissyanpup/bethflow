import { create } from 'zustand';
import type { UserPublic } from '@bethflow/shared';
import { api, setAccessToken } from '../lib/api.js';

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setSession: (user: UserPublic, accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post<{ success: true; data: { user: UserPublic; accessToken: string } }>(
      '/auth/login',
      { email, password },
    );
    setAccessToken(res.data.data.accessToken);
    set({ user: res.data.data.user });
  },

  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user });
  },

  logout: async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    set({ user: null });
  },

  refresh: async () => {
    try {
      const res = await api.post<{ success: true; data: { accessToken: string } }>('/auth/refresh');
      setAccessToken(res.data.data.accessToken);
      const me = await api.get<{ success: true; data: UserPublic }>('/users/me');
      set({ user: me.data.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
