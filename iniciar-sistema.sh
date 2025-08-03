#!/bin/bash

echo "🚀 INICIANDO WHATICKET LOCAL - macOS"
echo "===================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js v20+ primeiro."
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! pgrep -x "postgres" > /dev/null; then
    echo "❌ PostgreSQL não está rodando. Inicie o PostgreSQL primeiro."
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Função para iniciar backend
start_backend() {
    echo "🔧 Iniciando Backend na porta 8081..."
    cd whaticket/backend
    node server-crack.js &
    BACKEND_PID=$!
    echo "✅ Backend iniciado (PID: $BACKEND_PID)"
    cd ../..
}

# Função para iniciar frontend
start_frontend() {
    echo "🎨 Iniciando Frontend na porta 3000..."
    cd whaticket/frontend
    npm start &
    FRONTEND_PID=$!
    echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"
    cd ../..
}

# Iniciar serviços
start_backend
sleep 3
start_frontend

echo ""
echo "🎉 WHATICKET INICIADO COM SUCESSO!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend:  http://localhost:8081"
echo ""
echo "Para parar o sistema: Ctrl+C ou pkill -f 'server-crack.js|npm start'"

# Aguardar interrupção
wait