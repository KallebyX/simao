// Configuração customizada do WPPConnect para Simão IA Rural
module.exports = {
  // Configurações do servidor
  host: '0.0.0.0',
  port: process.env.PORT || 21465,
  
  // Configurações de autenticação
  secretKey: process.env.SECRET_KEY || 'wppconnect_secret_simao_2024',
  
  // Configurações de sessão
  session: process.env.SESSION_NAME || 'simao_session',
  
  // Configurações do webhook
  webhook: {
    url: process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhook',
    autoDownload: true,
    uploadS3: false,
    readMessage: true,
    allUnreadOnStart: false,
    listenAcks: true,
    onPresenceChanged: false,
    onParticipantsChanged: false,
    onReactionMessage: false,
    onPollResponse: false,
    onRevokedMessage: false,
    onLabelUpdated: false,
    onSelfMessage: false,
    ignore: ['status@broadcast']
  },
  
  // Configurações do navegador
  puppeteerOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
  },
  
  // Configurações de arquivos
  tokenStoreType: 'file',
  folderNameToken: './tokens',
  mkdirFolderToken: '',
  
  // Configurações de logs
  log: {
    level: process.env.LOG_LEVEL || 'info',
    logger: ['console']
  },
  
  // Configurações de CORS
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Configurações de arquivos de mídia
  createOptions: {
    browserWS: '',
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  
  // Configurações de download automático
  autoDownload: true,
  downloadPath: './downloads',
  
  // Configurações de reconexão
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 30000,
  
  // Configurações de timeout
  timeout: 60000,
  
  // Configurações específicas do WhatsApp
  whatsappOptions: {
    multiDevice: true,
    updatesLog: false,
    disableWelcome: true,
    debug: false
  },
  
  // Configurações de API
  api: {
    // Endpoints habilitados
    enabledEndpoints: [
      'send-message',
      'send-image',
      'send-file',
      'send-voice',
      'send-location',
      'send-contact',
      'get-messages',
      'get-chats',
      'get-contacts',
      'get-status',
      'start-session',
      'close-session',
      'logout-session',
      'status-session',
      'generate-token'
    ],
    
    // Rate limiting
    rateLimit: {
      windowMs: 60000, // 1 minuto
      max: 100 // máximo 100 requests por minuto
    }
  },
  
  // Configurações de segurança
  security: {
    // Validar origem das requisições
    validateOrigin: false,
    
    // Headers de segurança
    securityHeaders: true,
    
    // Timeout para operações
    operationTimeout: 30000
  },
  
  // Configurações de monitoramento
  monitoring: {
    // Métricas habilitadas
    enabled: true,
    
    // Endpoint de health check
    healthCheck: '/health',
    
    // Logs de performance
    performanceLogs: false
  }
};

