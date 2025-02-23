import { create } from 'zustand';
import { User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User, accessToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setUser: (user: User, accessToken: string) => set({ user, accessToken }),
  clearUser: () => set({ user: null, accessToken: null }),
}));
