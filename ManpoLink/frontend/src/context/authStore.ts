import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Employee } from '@/types';

interface AuthStore {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  
  setUser: (user: User | null) => void;
  setEmployee: (employee: Employee | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  toggleDarkMode: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      employee: null,
      token: null,
      isAuthenticated: false,
      isDarkMode: false,

      setUser: (user) => set({ user }),
      setEmployee: (employee) => set({ employee }),
      setToken: (token) => set({ token }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      toggleDarkMode: () => set((state) => ({
        isDarkMode: !state.isDarkMode
      })),

      logout: () => set({
        user: null,
        employee: null,
        token: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        employee: state.employee,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isDarkMode: state.isDarkMode,
      })
    }
  )
);

export type { User, Employee };
