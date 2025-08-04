#!/bin/bash

# Script para iniciar desenvolvimento rapidamente

echo "🚀 Iniciando Whaticket em modo desenvolvimento..."

# Terminal 1: Backend
echo "📦 Iniciando backend na porta 8081..."
cd /workspaces/simao/whaticket/backend
node server-crack.js &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 5

# Terminal 2: Frontend
echo "⚛️  Iniciando frontend na porta 3000..."
cd /workspaces/simao/whaticket/frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8081"
echo "📧 MailHog: http://localhost:8025"
echo ""
echo "Para parar: killall node"
echo "PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"

# Aguardar processos
wait $BACKEND_PID $FRONTEND_PID
