const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware para JSON
app.use(express.json());

// Servir arquivos estáticos do frontend se existirem
const frontendBuild = path.join(__dirname, 'whaticket/frontend/build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
}

// Fallback - servir index.html para qualquer rota (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuild, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Se não houver build, criar uma página de login básica funcional
      res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whaticket - Sistema</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 400px; margin: 100px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; color: #1976d2; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        button:hover { background: #1565c0; }
        .error { color: #f44336; margin-top: 10px; display: none; }
        .success { color: #4caf50; margin-top: 10px; display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🎯 Whaticket</h1>
            <p>Sistema de Atendimento</p>
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="password">Senha:</label>
                <input type="password" id="password" name="password" required>
            </div>

            <button type="submit">Entrar</button>
            
            <div id="error" class="error"></div>
            <div id="success" class="success"></div>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');
            const successDiv = document.getElementById('success');
            
            // Limpar mensagens anteriores
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            try {
                // Fazer login real na API backend
                const response = await fetch('http://localhost:8081/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.token) {
                    // Login bem-sucedido
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    successDiv.textContent = '✅ Login realizado com sucesso! Redirecionando...';
                    successDiv.style.display = 'block';
                    
                    // Redirecionar para dashboard (simular por enquanto)
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    // Erro de login
                    errorDiv.textContent = data.message || 'Erro no login. Verifique suas credenciais.';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Erro:', error);
                errorDiv.textContent = 'Erro de conexão com o servidor.';
                errorDiv.style.display = 'block';
            }
        });

        // Testar conexão com backend ao carregar a página
        window.addEventListener('load', async () => {
            try {
                const response = await fetch('http://localhost:8081/auth/refresh', {
                    method: 'POST'
                });
                console.log('Backend conectado:', response.ok ? 'OK' : 'Erro ' + response.status);
            } catch (error) {
                console.log('Erro de conexão com backend:', error);
            }
        });
    </script>
</body>
</html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server rodando em http://localhost:${PORT}`);
  console.log(`🔗 Conectando ao backend em http://localhost:8081`);
  console.log(`📁 Servindo frontend build quando disponível`);
});