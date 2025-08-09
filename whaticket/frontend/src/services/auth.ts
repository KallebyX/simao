import { apiService } from './api';
import { AuthResponse, LoginRequest, User } from '@/types';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.token) {
        this.setAuthHeader(response.token);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  }

  // Refresh tokens
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await apiService.post<{ token: string; refreshToken: string }>(
        '/auth/refresh', 
        { refreshToken }
      );
      
      if (response.token) {
        this.setAuthHeader(response.token);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao renovar token');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we clear local data
      console.warn('Logout request failed:', error);
    } finally {
      this.clearAuthHeader();
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      return await apiService.get<User>('/auth/me');
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao obter dados do usuário');
    }
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      return await apiService.put<User>('/auth/profile', data);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao alterar senha');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiService.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao enviar email de recuperação');
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/auth/reset-password', {
        token,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao redefinir senha');
    }
  }

  // Verify if user is authenticated
  async verifyAuth(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set authorization header
  setAuthHeader(token: string): void {
    apiService.setAuthHeader(token);
  }

  // Clear authorization header
  clearAuthHeader(): void {
    apiService.clearAuthHeader();
  }

  // Check if token exists in storage
  hasStoredToken(): boolean {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return !!parsed.state?.token;
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    }
    return false;
  }

  // Get stored user data
  getStoredUser(): User | null {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.user || null;
      }
    } catch (error) {
      console.error('Error getting stored user:', error);
    }
    return null;
  }

  // Validate token format
  isValidTokenFormat(token: string): boolean {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  // Decode JWT payload (without verification - for client info only)
  decodeTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeTokenPayload(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;