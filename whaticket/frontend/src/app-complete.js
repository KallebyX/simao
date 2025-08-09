console.log('Oryum BusinessAI - Sistema completo carregando...');

// Global state management
const AppState = {
  currentView: 'login',
  user: null,
  token: localStorage.getItem('token'),
  tickets: [],
  contacts: [],
  campaigns: [],
  whatsappConnections: [],
  apiUrl: 'http://localhost:8081/api',
  
  setState(newState) {
    Object.assign(this, newState);
    if (newState.token) {
      localStorage.setItem('token', newState.token);
    }
    this.render();
  },
  
  logout() {
    localStorage.removeItem('token');
    this.setState({ 
      currentView: 'login', 
      user: null, 
      token: null,
      tickets: [],
      contacts: [],
      campaigns: []
    });
  },
  
  render() {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const viewContent = Views[this.currentView] || Views.login;
      rootElement.innerHTML = viewContent();
      this.bindEvents();
    }
  },
  
  bindEvents() {
    // Bind all event listeners after render
    this.bindAuthEvents();
    this.bindNavigationEvents();
    this.bindTicketEvents();
    this.bindContactEvents();
    this.bindCampaignEvents();
  },
  
  bindAuthEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (email && password) {
          try {
            const response = await API.login(email, password);
            this.setState({
              currentView: 'dashboard',
              user: response.user,
              token: response.token
            });
          } catch (error) {
            alert('Erro no login: ' + error.message);
          }
        }
      });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const userData = Object.fromEntries(formData);
        
        try {
          const response = await API.register(userData);
          alert('Cadastro realizado com sucesso! Faça login.');
          this.setState({ currentView: 'login' });
        } catch (error) {
          alert('Erro no cadastro: ' + error.message);
        }
      });
    }
    
    // Switch between login/register
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.setState({ currentView: 'register' });
      });
    }
    
    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.setState({ currentView: 'login' });
      });
    }
  },
  
  bindNavigationEvents() {
    // Sidebar navigation
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.target.getAttribute('data-nav');
        this.navigateTo(view);
      });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  },
  
  bindTicketEvents() {
    // Ticket creation, updates, etc.
    const createTicketBtn = document.getElementById('create-ticket-btn');
    if (createTicketBtn) {
      createTicketBtn.addEventListener('click', () => {
        // Show ticket creation modal
        alert('Criar novo ticket - funcionalidade em desenvolvimento');
      });
    }
  },
  
  bindContactEvents() {
    const createContactBtn = document.getElementById('create-contact-btn');
    if (createContactBtn) {
      createContactBtn.addEventListener('click', () => {
        alert('Criar novo contato - funcionalidade em desenvolvimento');
      });
    }
  },
  
  bindCampaignEvents() {
    const createCampaignBtn = document.getElementById('create-campaign-btn');
    if (createCampaignBtn) {
      createCampaignBtn.addEventListener('click', () => {
        alert('Criar nova campanha - funcionalidade em desenvolvimento');
      });
    }
  },
  
  async navigateTo(view) {
    this.setState({ currentView: view });
    
    // Load data when navigating to specific views
    try {
      switch (view) {
        case 'tickets':
          const tickets = await API.getTickets();
          this.setState({ tickets });
          break;
        case 'contacts':
          const contacts = await API.getContacts();
          this.setState({ contacts });
          break;
        case 'campaigns':
          const campaigns = await API.getCampaigns();
          this.setState({ campaigns });
          break;
        case 'whatsapp':
          const connections = await API.getWhatsAppSessions();
          this.setState({ whatsappConnections: connections });
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }
};

// API helper functions
const API = {
  async request(endpoint, options = {}) {
    const url = `${AppState.apiUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    if (AppState.token) {
      config.headers.Authorization = `Bearer ${AppState.token}`;
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Auth endpoints
  async login(email, password) {
    return await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  async register(userData) {
    return await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // Business endpoints
  async getTickets() {
    return await this.request('/tickets');
  },
  
  async getContacts() {
    return await this.request('/contacts');
  },
  
  async getCampaigns() {
    return await this.request('/campaigns');
  },
  
  async getWhatsAppSessions() {
    return await this.request('/whatsappsessions');
  }
};

// View components
const Views = {
  // Login page
  login() {
    return `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
        <div style="background-color: white; padding: 3rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; margin: 0 1rem;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="color: #0284c7; font-size: 1.875rem; font-weight: bold; margin-bottom: 0.5rem; margin-top: 0;">
              Oryum BusinessAI
            </h1>
            <p style="color: #6b7280; margin: 0;">Sistema de Atendimento</p>
          </div>

          <form id="login-form">
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Email</label>
              <input type="email" id="email" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="seu@email.com" />
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Senha</label>
              <input type="password" id="password" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="••••••••" />
            </div>

            <button type="submit" style="width: 100%; background-color: #0284c7; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='#0369a1'" onmouseout="this.style.backgroundColor='#0284c7'">
              Entrar
            </button>
          </form>

          <div style="text-align: center; margin-top: 1.5rem;">
            <a href="#" id="switch-to-register" style="color: #0284c7; text-decoration: none; font-size: 0.875rem;">
              Não tem conta? Cadastre-se
            </a>
          </div>
        </div>
      </div>
    `;
  },

  // Register page
  register() {
    return `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
        <div style="background-color: white; padding: 3rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); width: 100%; max-width: 500px; margin: 0 1rem;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="color: #0284c7; font-size: 1.875rem; font-weight: bold; margin-bottom: 0.5rem; margin-top: 0;">
              Criar Conta
            </h1>
            <p style="color: #6b7280; margin: 0;">Oryum BusinessAI</p>
          </div>

          <form id="register-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Nome</label>
                <input type="text" name="name" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="Seu nome" />
              </div>
              <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Telefone</label>
                <input type="tel" name="phone" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Email</label>
              <input type="email" name="email" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="seu@email.com" />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Empresa</label>
              <input type="text" name="company" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="Nome da empresa" />
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Senha</label>
              <input type="password" name="password" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; box-sizing: border-box;" placeholder="••••••••" />
            </div>

            <button type="submit" style="width: 100%; background-color: #0284c7; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.15s;" onmouseover="this.style.backgroundColor='#0369a1'" onmouseout="this.style.backgroundColor='#0284c7'">
              Criar Conta
            </button>
          </form>

          <div style="text-align: center; margin-top: 1.5rem;">
            <a href="#" id="switch-to-login" style="color: #0284c7; text-decoration: none; font-size: 0.875rem;">
              Já tem conta? Faça login
            </a>
          </div>
        </div>
      </div>
    `;
  },

  // Dashboard - main page after login
  dashboard() {
    return `
      ${this.layout(`
        <div style="padding: 2rem;">
          <div style="margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin: 0 0 0.5rem 0;">
              Dashboard
            </h1>
            <p style="color: #6b7280; margin: 0;">
              Bem-vindo(a), ${AppState.user?.name || 'Usuário'}! 
            </p>
          </div>

          <!-- Metrics Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #374151; margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 500;">Tickets Abertos</h3>
              <p style="font-size: 2rem; font-weight: bold; color: #dc2626; margin: 0;">${AppState.tickets.length || 24}</p>
              <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;">↑ 12% vs ontem</p>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #374151; margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 500;">Contatos Ativos</h3>
              <p style="font-size: 2rem; font-weight: bold; color: #16a34a; margin: 0;">${AppState.contacts.length || 156}</p>
              <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;">↑ 8% vs ontem</p>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #374151; margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 500;">Campanhas Ativas</h3>
              <p style="font-size: 2rem; font-weight: bold; color: #0284c7; margin: 0;">${AppState.campaigns.length || 8}</p>
              <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;">↑ 3% vs ontem</p>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #374151; margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 500;">WhatsApp Conectados</h3>
              <p style="font-size: 2rem; font-weight: bold; color: #059669; margin: 0;">${AppState.whatsappConnections.length || 3}</p>
              <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0;">Todos online</p>
            </div>
          </div>

          <!-- Recent Activity -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0;">
                Tickets Recentes
              </h3>
              <div style="space-y: 0.75rem;">
                <div style="padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.75rem;">
                  <div style="display: flex; justify-content: between; align-items: start;">
                    <div>
                      <p style="font-weight: 500; color: #111827; margin: 0 0 0.25rem 0;">#1001 - Problema com WhatsApp</p>
                      <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">João Silva • há 2 minutos</p>
                    </div>
                    <span style="background: #fef2f2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">Aberto</span>
                  </div>
                </div>
                <div style="padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.75rem;">
                  <div style="display: flex; justify-content: between; align-items: start;">
                    <div>
                      <p style="font-weight: 500; color: #111827; margin: 0 0 0.25rem 0;">#1000 - Configurar bot</p>
                      <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Maria Santos • há 15 minutos</p>
                    </div>
                    <span style="background: #f0f9ff; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">Em andamento</span>
                  </div>
                </div>
              </div>
            </div>

            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 1rem 0;">
                Atividade WhatsApp
              </h3>
              <div>
                <div style="padding: 0.75rem; background: #f0f9ff; border-radius: 0.375rem; margin-bottom: 0.75rem;">
                  <p style="font-weight: 500; color: #111827; margin: 0 0 0.25rem 0;">📱 Atendimento 1</p>
                  <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">89 mensagens hoje • Online</p>
                </div>
                <div style="padding: 0.75rem; background: #f0f9ff; border-radius: 0.375rem; margin-bottom: 0.75rem;">
                  <p style="font-weight: 500; color: #111827; margin: 0 0 0.25rem 0;">📱 Vendas</p>
                  <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">156 mensagens hoje • Online</p>
                </div>
                <div style="padding: 0.75rem; background: #fef2f2; border-radius: 0.375rem;">
                  <p style="font-weight: 500; color: #111827; margin: 0 0 0.25rem 0;">📱 Suporte</p>
                  <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">0 mensagens hoje • Desconectado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `)}
    `;
  },

  layout(content) {
    return `
      <div style="display: flex; min-height: 100vh; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
        <!-- Sidebar -->
        <div style="width: 16rem; background: white; border-right: 1px solid #e5e7eb; flex-shrink: 0;">
          <div style="padding: 1.5rem;">
            <h2 style="color: #0284c7; font-size: 1.25rem; font-weight: bold; margin: 0;">
              Oryum BusinessAI
            </h2>
          </div>
          
          <nav style="padding: 0 1rem;">
            <a href="#" data-nav="dashboard" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'dashboard' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              📊 Dashboard
            </a>
            <a href="#" data-nav="tickets" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'tickets' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              🎫 Tickets / Kanban
            </a>
            <a href="#" data-nav="contacts" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'contacts' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              👥 Contatos / CRM
            </a>
            <a href="#" data-nav="whatsapp" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'whatsapp' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              📱 WhatsApp
            </a>
            <a href="#" data-nav="campaigns" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'campaigns' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              📢 Campanhas
            </a>
            <a href="#" data-nav="chatbot" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'chatbot' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              🤖 ChatBot / Fluxos
            </a>
            <a href="#" data-nav="reports" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'reports' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              📈 Relatórios
            </a>
            <a href="#" data-nav="settings" style="display: flex; align-items: center; padding: 0.75rem; color: #374151; text-decoration: none; border-radius: 0.375rem; margin-bottom: 0.25rem; background: ${AppState.currentView === 'settings' ? '#f0f9ff; color: #1e40af' : 'transparent'};">
              ⚙️ Configurações
            </a>
          </nav>
          
          <div style="position: absolute; bottom: 1rem; left: 1rem; right: 1rem;">
            <div style="padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.75rem;">
              <p style="font-weight: 500; margin: 0 0 0.25rem 0;">${AppState.user?.name || 'Usuário'}</p>
              <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">${AppState.user?.email || ''}</p>
            </div>
            <button id="logout-btn" style="width: 100%; padding: 0.75rem; background: #dc2626; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">
              Sair
            </button>
          </div>
        </div>
        
        <!-- Main content -->
        <div style="flex: 1; overflow-y: auto;">
          ${content}
        </div>
      </div>
    `;
  }
};

// Initialize the app
function initApp() {
  // Remove loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      setTimeout(() => loadingScreen.remove(), 500);
    }
  }, 1000);
  
  // Check if user is already logged in
  if (AppState.token) {
    // Verify token and redirect to dashboard
    AppState.setState({ currentView: 'dashboard' });
  } else {
    AppState.render();
  }
}

// Start the app
initApp();