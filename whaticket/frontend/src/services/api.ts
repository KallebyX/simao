import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add company ID to requests if available
        const companyId = this.getStoredCompanyId();
        if (companyId && !config.headers['Companyid']) {
          config.headers['Companyid'] = companyId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setAuthHeader(response.data.token);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getStoredToken(): string | null {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error('Error getting stored token:', error);
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.refreshToken || null;
      }
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
    }
    return null;
  }

  private getStoredCompanyId(): number | null {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.user?.companyId || null;
      }
    } catch (error) {
      console.error('Error getting stored company ID:', error);
    }
    return null;
  }

  private async refreshToken(refreshToken: string) {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  private handleAuthFailure() {
    // Clear stored auth data
    localStorage.removeItem('auth-storage');
    
    // Redirect to login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Erro no servidor';
      return {
        message,
        statusCode: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Erro de conexão. Verifique sua internet.',
        statusCode: 0,
        details: error.request
      };
    } else {
      // Other error
      return {
        message: error.message || 'Erro desconhecido',
        statusCode: 0,
        details: error
      };
    }
  }

  // Public methods
  public setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public clearAuthHeader() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Upload files
  public async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const uploadConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await this.api.post<T>(url, formData, uploadConfig);
    return response.data;
  }

  // Download files
  public async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.api.get(url, {
      ...config,
      responseType: 'blob'
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Get base URL for absolute URLs
  public getBaseURL(): string {
    return this.baseURL;
  }

  // Get API instance for advanced usage
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;