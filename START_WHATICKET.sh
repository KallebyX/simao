#!/bin/bash

echo "🔥 FORÇANDO WHATICKET A FUNCIONAR - MODO AGRESSIVO!"

# Matar TUDO
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "npm" 2>/dev/null || true
pkill -9 -f "react" 2>/dev/null || true
pkill -9 -f "ts-node" 2>/dev/null || true

# Limpar portas
lsof -ti:3000,8081 | xargs kill -9 2>/dev/null || true

echo "💀 Todos os processos mortos!"

# Definir Node corretamente
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Garantir infraestrutura
echo "🐳 Garantindo infraestrutura Docker..."
docker-compose up -d postgres redis mailhog

sleep 5

echo "⚙️  Iniciando BACKEND com Node 18..."
cd whaticket/backend
nvm use 18
nvm run db:migrate 2>/dev/null || true
nvm run db:seed 2>/dev/null || true

# Iniciar backend de forma robusta
nohup npm run dev:server > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 10

# Testar backend
if curl -s http://localhost:8081 >/dev/null; then
    echo "✅ Backend FUNCIONANDO!"
else
    echo "❌ Backend falhou!"
    exit 1
fi

echo "🎨 FORÇANDO Frontend com Node 18..."
cd ../frontend

# Remover node_modules e reinstalar com Node 18
rm -rf node_modules package-lock.json
nvm use 18
npm install --legacy-peer-deps --force

# Configurar React para Node 18
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export BROWSER=none
export HOST=0.0.0.0
export PORT=3000

# FORÇAR start do React
nohup npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "⏳ Aguardando frontend inicializar..."
sleep 45

# Testar frontend
for i in {1..10}; do
    if curl -s http://localhost:3000 >/dev/null; then
        echo "🎉 FRONTEND FUNCIONANDO!"
        break
    else
        echo "Tentativa $i/10 - Aguardando..."
        sleep 10
    fi
done

echo ""
echo "🚀 SISTEMA WHATICKET ATIVO!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8081" 
echo "📧 MailHog: http://localhost:8025"
echo ""
echo "Login: admin@admin.com / admin"
echo ""
echo "PIDs para parar:"
echo "Backend: $BACKEND_PID"
echo "Frontend: $FRONTEND_PID"
echo ""
echo "Para parar: kill $BACKEND_PID $FRONTEND_PID"

# Monitorar logs
echo "📋 Logs backend: tail -f /tmp/backend.log"
echo "📋 Logs frontend: tail -f /tmp/frontend.log"