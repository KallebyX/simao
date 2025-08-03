const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Proxy para o backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'whaticket/frontend/build')));

// Para React Router - todas as rotas devem servir o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'whaticket/frontend/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor funcionando em http://localhost:${PORT}`);
  console.log(`🔧 Proxy para backend: http://localhost:8081`);
});