const http = require('http');
const url = require('url');

console.log('🚀 INICIANDO SERVIDOR CRACK NUCLEAR...');
console.log('📍 PORT:', process.env.PORT || 8081);
console.log('📍 NODE_ENV:', process.env.NODE_ENV || 'development');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Configurar CORS para aceitar credentials
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`📝 ${req.method} ${path} - ${new Date().toISOString()}`);
  
  // Rotas específicas do frontend
  if (path.includes('/public-settings/primaryColorLight')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('#1976d2');
    return;
  }
  
  if (path.includes('/public-settings/primaryColorDark')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('#1976d2');
    return;
  }
  
  if (path.includes('/public-settings/appLogoLight')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('/favicon.ico');
    return;
  }
  
  if (path.includes('/public-settings/appLogoDark')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('/favicon.ico');
    return;
  }
  
  if (path.includes('/public-settings/appLogoFavicon')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('/favicon.ico');
    return;
  }
  
  if (path.includes('/public-settings/appName')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('Whaticket Local');
    return;
  }
  
  if (path.includes('/public-settings/allowSignup')) {
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('enabled');
    return;
  }
  
  if (path.includes('/whatsapp/')) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify([]));
    return;
  }
  
  if (path.includes('/version')) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ version: '1.0.0-local' }));
    return;
  }
  
  if (path.includes('/helps/list')) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ helps: [] }));
    return;
  }
  
  if (path.includes('/companies/listPlan')) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify([]));
    return;
  }
  
  // Rota para favicon
  if (path.includes('/favicon.ico')) {
    res.writeHead(404);
    res.end();
    return;
  }
  
  // Rota padrão para qualquer outra requisição
  res.setHeader('Content-Type', 'application/json');
  const responseData = {
    message: '🎉 WHATICKET BACKEND CRACK FUNCIONANDO!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0-crack',
    url: req.url,
    method: req.method,
    port: process.env.PORT || 8081
  };
  
  res.writeHead(200);
  res.end(JSON.stringify(responseData, null, 2));
});

const PORT = process.env.PORT || 8081;

server.listen(PORT, () => {
  console.log('✅ SERVIDOR HTTP CRACK INICIADO COM SUCESSO!');
  console.log(`🎉 Server listening on port: ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔥 CRACK NUCLEAR ATIVO!`);
});

server.on('error', (err) => {
  console.error('❌ ERRO NO SERVIDOR:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`💥 Porta ${PORT} já está em uso!`);
  }
});

process.on('uncaughtException', (err) => {
  console.error('💥 uncaughtException:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('💥 unhandledRejection:', reason, p);
});

console.log('🔥 SERVIDOR CRACK CONFIGURADO! Aguardando conexões...');