import { create } from 'zustand';

interface AuthState {
  isTestAuthenticated: boolean;
  setTestAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isTestAuthenticated: false,
  setTestAuthenticated: (value) => set({ isTestAuthenticated: value }),
})); 