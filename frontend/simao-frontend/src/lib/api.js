// Configuração da API para comunicação com o backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async login(email, senha) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async register(dados) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(dados) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  }

  logout() {
    this.setToken(null);
  }

  // Métodos de leads
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leads${queryString ? `?${queryString}` : ''}`);
  }

  async getLead(id) {
    return this.request(`/leads/${id}`);
  }

  async createLead(dados) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  }

  async updateLead(id, dados) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  }

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async sendMessageToLead(id, content) {
    return this.request(`/leads/${id}/send-message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getLeadsStats() {
    return this.request('/leads/stats');
  }

  // Métodos do WhatsApp
  async getWhatsAppStatus() {
    return this.request('/whatsapp/status');
  }

  async startWhatsAppSession() {
    return this.request('/whatsapp/start-session', {
      method: 'POST',
    });
  }

  async getQRCode() {
    return this.request('/whatsapp/qr-code');
  }

  async logoutWhatsApp() {
    return this.request('/whatsapp/logout', {
      method: 'POST',
    });
  }

  async sendTestMessage(phone, message) {
    return this.request('/whatsapp/send-test-message', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    });
  }

  async getWhatsAppChats() {
    return this.request('/whatsapp/chats');
  }

  // Métodos do webhook
  async getWebhookStatus() {
    return this.request('/webhook/status');
  }

  // Métodos de billing
  async getPlanos() {
    return this.request('/billing/planos');
  }

  async getAssinaturaAtual() {
    return this.request('/billing/assinatura');
  }

  async criarCheckout(dados) {
    return this.request('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  }

  async criarPortal() {
    return this.request('/billing/portal', {
      method: 'POST',
    });
  }

  async cancelarAssinatura() {
    return this.request('/billing/cancelar', {
      method: 'POST',
    });
  }

  async getFaturas() {
    return this.request('/billing/faturas');
  }

  async getUso() {
    return this.request('/billing/uso');
  }

  async iniciarTrial() {
    return this.request('/billing/trial', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
export default api;

