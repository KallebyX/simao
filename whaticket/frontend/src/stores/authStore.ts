import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company, AuthResponse, LoginRequest } from '@/types';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      company: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ loading: true, error: null });

          const response: AuthResponse = await authService.login(credentials);
          
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            loading: false,
            error: null
          });

          // Set auth header for future requests
          authService.setAuthHeader(response.token);

        } catch (error: any) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: error.message || 'Erro ao fazer login'
          });
          throw error;
        }
      },

      logout: () => {
        // Clear auth header
        authService.clearAuthHeader();
        
        set({
          user: null,
          company: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
      },

      refreshTokens: async () => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authService.refreshToken(refreshToken);
          
          set({
            token: response.token,
            refreshToken: response.refreshToken
          });

          // Update auth header
          authService.setAuthHeader(response.token);

        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData }
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Set auth header if token exists after rehydration
        if (state?.token) {
          authService.setAuthHeader(state.token);
        }
      }
    }
  )
);

export default useAuthStore;