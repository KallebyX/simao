import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import { authService } from '@/services/auth';
import { LoginRequest } from '@/types';

export const useAuth = () => {
  const {
    user,
    company,
    token,
    refreshToken,
    isAuthenticated,
    loading,
    error,
    login: storeLogin,
    logout: storeLogout,
    refreshTokens,
    updateUser,
    clearError,
    setLoading
  } = useAuthStore();

  const { showSuccess, showError } = useNotificationStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // If we have a token, verify it's still valid
      if (token && isAuthenticated) {
        try {
          // Check if token is expired
          if (authService.isTokenExpired(token)) {
            // Try to refresh
            if (refreshToken) {
              await refreshTokens();
              showSuccess('Sessão renovada com sucesso');
            } else {
              storeLogout();
              showError('Sessão expirada. Faça login novamente.');
            }
          } else {
            // Token is valid, verify with server
            const isValid = await authService.verifyAuth();
            if (!isValid) {
              storeLogout();
              showError('Sessão inválida. Faça login novamente.');
            }
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          storeLogout();
          showError('Erro ao verificar autenticação');
        }
      }
    };

    initializeAuth();
  }, [token, isAuthenticated, refreshToken, refreshTokens, storeLogout, showSuccess, showError]);

  // Login function with error handling
  const login = async (credentials: LoginRequest) => {
    try {
      clearError();
      await storeLogin(credentials);
      showSuccess(`Bem-vindo(a), ${useAuthStore.getState().user?.name}!`);
    } catch (error: any) {
      showError(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  // Logout function with confirmation
  const logout = async (showMessage = true) => {
    try {
      await authService.logout();
      storeLogout();
      if (showMessage) {
        showSuccess('Logout realizado com sucesso');
      }
    } catch (error: any) {
      // Even if server logout fails, we clear local state
      storeLogout();
      console.error('Logout error:', error);
      if (showMessage) {
        showSuccess('Logout realizado');
      }
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      showSuccess('Senha alterada com sucesso');
    } catch (error: any) {
      showError(error.message || 'Erro ao alterar senha');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: any) => {
    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(data);
      updateUser(updatedUser);
      showSuccess('Perfil atualizado com sucesso');
      return updatedUser;
    } catch (error: any) {
      showError(error.message || 'Erro ao atualizar perfil');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user || !isAuthenticated) return false;

    // Admin has all permissions
    if (user.profile === 'admin') return true;

    // Add specific permission logic here
    switch (permission) {
      case 'user:create':
      case 'user:edit':
      case 'user:delete':
      case 'company:edit':
      case 'queue:create':
      case 'queue:edit':
      case 'queue:delete':
      case 'whatsapp:create':
      case 'whatsapp:edit':
      case 'whatsapp:delete':
      case 'campaign:create':
      case 'campaign:edit':
      case 'campaign:delete':
      case 'settings:edit':
        return user.profile === 'admin';
      
      case 'ticket:all':
        return user.profile === 'admin' || user.profile === 'supervisor' || user.allTicket === 'enabled';
      
      case 'dashboard:view':
        return user.profile === 'admin' || user.profile === 'supervisor';
      
      case 'reports:view':
        return user.profile === 'admin' || user.profile === 'supervisor';
      
      case 'contacts:create':
      case 'contacts:edit':
      case 'quickmessage:create':
      case 'quickmessage:edit':
        return true; // All authenticated users can do these
      
      default:
        return false;
    }
  };

  // Check if user can access specific route
  const canAccessRoute = (route: string): boolean => {
    if (!user || !isAuthenticated) return false;

    // Admin can access all routes
    if (user.profile === 'admin') return true;

    // Define route permissions
    const adminOnlyRoutes = [
      '/users',
      '/companies',
      '/queues',
      '/whatsapp-connections',
      '/campaigns',
      '/settings',
      '/financeiro'
    ];

    const supervisorRoutes = [
      '/dashboard',
      '/reports',
      '/tickets'
    ];

    if (adminOnlyRoutes.some(r => route.startsWith(r))) {
      return user.profile === 'admin';
    }

    if (supervisorRoutes.some(r => route.startsWith(r))) {
      return user.profile === 'admin' || user.profile === 'supervisor';
    }

    // Default routes accessible to all authenticated users
    return true;
  };

  return {
    // State
    user,
    company,
    token,
    refreshToken,
    isAuthenticated,
    loading,
    error,

    // Actions
    login,
    logout,
    changePassword,
    updateProfile,
    clearError,

    // Permissions
    hasPermission,
    canAccessRoute,

    // Utilities
    isAdmin: user?.profile === 'admin',
    isSupervisor: user?.profile === 'supervisor',
    isUser: user?.profile === 'user'
  };
};