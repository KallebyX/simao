#!/bin/bash

# Inicializador completo do Whaticket
# Este script configura e inicia todo o ambiente de desenvolvimento

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[INIT] $1${NC}"; }
warn() { echo -e "${YELLOW}[INIT] $1${NC}"; }
error() { echo -e "${RED}[INIT] $1${NC}"; }
info() { echo -e "${BLUE}[INIT] $1${NC}"; }

echo -e "${CYAN}"
echo "🚀 WHATICKET FULL SETUP & START"
echo "================================"
echo -e "${NC}"

# 1. Verificar se Docker está rodando
log "1. Verificando Docker..."
if ! docker ps >/dev/null 2>&1; then
    error "Docker não está rodando! Inicie o Docker primeiro."
    exit 1
fi
info "✅ Docker está rodando"

# 2. Subir infraestrutura
log "2. Subindo infraestrutura (PostgreSQL, Redis, MailHog)..."
cd /workspaces/simao
docker-compose up -d
sleep 5

# 3. Verificar serviços
log "3. Verificando serviços..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 4. Instalar dependências se necessário
log "4. Verificando dependências..."
if [ ! -d "whaticket/backend/node_modules" ]; then
    log "Instalando dependências do backend..."
    cd whaticket/backend && npm install --legacy-peer-deps
fi

if [ ! -d "whaticket/frontend/node_modules" ]; then
    log "Instalando dependências do frontend..."
    cd ../frontend && npm install --legacy-peer-deps
fi

# 5. Executar migrações
log "5. Executando migrações do banco..."
cd /workspaces/simao/whaticket/backend
npx sequelize-cli db:migrate --env production 2>/dev/null || {
    warn "Algumas migrações falharam, mas continuando..."
}

# 6. Criar arquivo de inicialização rápida
log "6. Criando scripts de inicialização..."
cat > /workspaces/simao/dev-start.sh << 'EOF'
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
EOF

chmod +x /workspaces/simao/dev-start.sh

# 7. Criar script de parada
cat > /workspaces/simao/dev-stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Parando Whaticket..."

# Matar processos Node
killall node 2>/dev/null || true
killall npm 2>/dev/null || true

# Parar Docker
cd /workspaces/simao
docker-compose down

echo "✅ Sistema parado!"
EOF

chmod +x /workspaces/simao/dev-stop.sh

log "7. Configuração completa!"
echo ""
echo -e "${CYAN}🎉 SISTEMA CONFIGURADO COM SUCESSO!${NC}"
echo ""
echo "📋 Comandos disponíveis:"
echo "  ./dev-start.sh    - Iniciar sistema completo"
echo "  ./dev-stop.sh     - Parar sistema completo"
echo "  q help            - Ver todos os comandos rápidos"
echo "  q start           - Iniciar via quick commands"
echo ""
echo "🌐 URLs importantes:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:8081"
echo "  MailHog: http://localhost:8025"
echo "  Queue Dashboard: http://localhost:8081/admin/queues"
echo ""
echo "▶️  Para iniciar agora: ./dev-start.sh"
