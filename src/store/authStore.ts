import { create } from 'zustand';
import type { EmployeeDto } from '@/types/auth.types';

interface AuthState {
  accessToken: string | null;
  user: EmployeeDto | null;
  requiresPasswordChange: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, requiresPasswordChange: boolean, user?: EmployeeDto | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  requiresPasswordChange: false,
  isAuthenticated: false,
  setAuth: (token, requiresPasswordChange, user = null) => 
    set({ 
      accessToken: token, 
      user, 
      requiresPasswordChange,
      isAuthenticated: true 
    }),
  clearAuth: () => 
    set({ 
      accessToken: null, 
      user: null, 
      requiresPasswordChange: false,
      isAuthenticated: false 
    })
}));
