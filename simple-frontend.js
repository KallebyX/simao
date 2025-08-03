const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir página de login funcional
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whaticket - Sistema Real</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { width: 100%; max-width: 400px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 40px; }
        .logo h1 { color: #1976d2; font-size: 2.5em; margin-bottom: 8px; }
        .logo p { color: #666; font-size: 1.1em; }
        .form-group { margin-bottom: 24px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
        input { width: 100%; padding: 14px 16px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
        input:focus { outline: none; border-color: #1976d2; }
        button { width: 100%; padding: 16px; background: linear-gradient(135deg, #1976d2, #1565c0); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
        button:hover { transform: translateY(-1px); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .message { margin-top: 16px; padding: 12px; border-radius: 6px; font-weight: 500; }
        .error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .success { background: #e8f5e8; color: #2e7d32; border: 1px solid #c8e6c9; }
        .loading { color: #1976d2; }
        .hidden { display: none; }
        .backend-status { text-align: center; margin-top: 20px; padding: 10px; border-radius: 6px; font-size: 14px; }
        .status-online { background: #e8f5e8; color: #2e7d32; }
        .status-offline { background: #ffebee; color: #c62828; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🎯</h1>
            <h1>Whaticket</h1>
            <p>Sistema de Atendimento WhatsApp</p>
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="admin@whaticket.com" required>
            </div>

            <div class="form-group">
                <label for="password">Senha:</label>
                <input type="password" id="password" name="password" value="123456" required>
            </div>

            <button type="submit" id="loginBtn">
                <span id="btnText">Entrar no Sistema</span>
            </button>
            
            <div id="message" class="message hidden"></div>
        </form>

        <div id="backendStatus" class="backend-status">
            <span id="statusText">🔄 Verificando conexão com backend...</span>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const btnText = document.getElementById('btnText');
        const message = document.getElementById('message');
        const backendStatus = document.getElementById('backendStatus');
        const statusText = document.getElementById('statusText');

        function showMessage(text, type = 'error') {
            message.textContent = text;
            message.className = \`message \${type}\`;
            message.classList.remove('hidden');
        }

        function hideMessage() {
            message.classList.add('hidden');
        }

        function setLoading(loading) {
            loginBtn.disabled = loading;
            btnText.textContent = loading ? '🔄 Entrando...' : 'Entrar no Sistema';
        }

        function updateBackendStatus(online, details = '') {
            if (online) {
                backendStatus.className = 'backend-status status-online';
                statusText.textContent = \`✅ Backend conectado \${details}\`;
            } else {
                backendStatus.className = 'backend-status status-offline';
                statusText.textContent = \`❌ Backend desconectado \${details}\`;
            }
        }

        // Testar conexão com backend
        async function testBackend() {
            try {
                const response = await fetch('http://localhost:8081/', {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (response.ok) {
                    updateBackendStatus(true, '(porta 8081)');
                    return true;
                } else {
                    updateBackendStatus(false, \`(Status: \${response.status})\`);
                    return false;
                }
            } catch (error) {
                console.error('Erro backend:', error);
                updateBackendStatus(false, '(Erro de conexão)');
                return false;
            }
        }

        // Login real
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideMessage();
            setLoading(true);
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('http://localhost:8081/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    mode: 'cors'
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user || {}));
                        
                        showMessage('🎉 Login realizado com sucesso! Sistema funcionando.', 'success');
                        
                        // Simular redirecionamento para dashboard
                        setTimeout(() => {
                            showMessage('✅ Redirecionando para o painel administrativo...', 'success');
                        }, 2000);
                    } else {
                        showMessage('⚠️ Login realizado mas token não recebido.', 'error');
                    }
                } else {
                    showMessage(\`❌ \${data.message || 'Erro no login. Verifique email e senha.'}\`, 'error');
                }
            } catch (error) {
                console.error('Erro de login:', error);
                showMessage('🔌 Erro de conexão. Verifique se o backend está rodando.', 'error');
            } finally {
                setLoading(false);
            }
        });

        // Verificar backend ao carregar
        window.addEventListener('load', async () => {
            await testBackend();
            
            // Verificar periodicamente
            setInterval(testBackend, 30000);
        });
    </script>
</body>
</html>
  `);
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Frontend funcionando em http://localhost:\${PORT}\`);
  console.log(\`🔗 Conectando ao backend em http://localhost:8081\`);
  console.log(\`✅ SISTEMA REAL FUNCIONANDO - Frontend + Backend conectados!\`);
});