#!/bin/bash

echo "🚀 Iniciando sistema Whaticket..."

# Certificar que as portas estão livres
echo "📋 Verificando portas..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Iniciar infraestrutura Docker
echo "🐳 Iniciando infraestrutura Docker..."
docker-compose up -d postgres redis mailhog

# Aguardar banco inicializar
echo "⏳ Aguardando banco de dados..."
sleep 10

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Iniciar Backend
echo "⚙️  Iniciando Backend..."
cd whaticket/backend
nvm use 18
npm run db:migrate 2>/dev/null || true
npm run db:seed 2>/dev/null || true
npm run dev:server &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 15

# Iniciar Frontend
echo "🎨 Iniciando Frontend..."
cd ../frontend
nvm use 16

# Definir variáveis de ambiente corretamente
export HOST=localhost
export PORT=3000
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export BROWSER=none

# Iniciar React sem NODE_OPTIONS problemático
./node_modules/.bin/react-scripts start &
FRONTEND_PID=$!

echo "✅ Sistema iniciado!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8081"
echo "📧 MailHog: http://localhost:8025"
echo ""
echo "Credenciais padrão:"
echo "Email: admin@admin.com"
echo "Senha: admin"
echo ""
echo "Para parar o sistema: kill $BACKEND_PID $FRONTEND_PID"

# Aguardar um tempo e verificar status
sleep 30
echo "🔍 Verificando status dos serviços..."
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:8081
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000

wait