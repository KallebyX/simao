#!/bin/bash

# 🚀 WHATICKET AUTO START SCRIPT
# Criado automaticamente pela configuração completa

echo "🚀 INICIANDO WHATICKET SISTEMA COMPLETO..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Diretório base
BASE_DIR="/Users/kalleby/Downloads/simao"
BACKEND_DIR="$BASE_DIR/whaticket/backend"
FRONTEND_DIR="$BASE_DIR/whaticket/frontend"

cd "$BASE_DIR" || { log_error "Diretório base não encontrado: $BASE_DIR"; exit 1; }

# 1. Verificar Docker
log_step "Verificando Docker..."
if ! docker ps >/dev/null 2>&1; then
    log_error "Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi
log_info "Docker está rodando"

# 2. Iniciar containers de infraestrutura
log_step "Iniciando containers de infraestrutura..."
docker-compose up -d
if [ $? -eq 0 ]; then
    log_info "Containers iniciados: PostgreSQL, Redis, MailHog"
else
    log_error "Falha ao iniciar containers"
    exit 1
fi

# 3. Aguardar serviços estarem prontos
log_step "Aguardando serviços estarem prontos..."
sleep 5

# Verificar PostgreSQL
for i in {1..30}; do
    if docker exec whaticket_postgres pg_isready -U whaticket >/dev/null 2>&1; then
        log_info "PostgreSQL está pronto"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL não ficou pronto em 30 segundos"
        exit 1
    fi
    sleep 1
done

# Verificar Redis
if docker exec whaticket_redis redis-cli ping >/dev/null 2>&1; then
    log_info "Redis está pronto"
else
    log_error "Redis não está respondendo"
    exit 1
fi

# 4. Iniciar Backend
log_step "Iniciando Backend na porta 8081..."
cd "$BACKEND_DIR" || { log_error "Diretório backend não encontrado"; exit 1; }

# Verificar se dist existe
if [ ! -d "dist" ]; then
    log_step "Compilando TypeScript..."
    npm run build
fi

# Iniciar backend em background
nohup node dist/server.js > backend.log 2>&1 &
BACKEND_PID=$!
log_info "Backend iniciado (PID: $BACKEND_PID)"

# 5. Aguardar backend estar pronto
log_step "Aguardando backend estar pronto..."
for i in {1..30}; do
    if curl -s http://localhost:8081/public-settings/appName >/dev/null 2>&1; then
        log_info "Backend está respondendo"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend não ficou pronto em 30 segundos"
        exit 1
    fi
    sleep 1
done

# 6. Iniciar Frontend
log_step "Iniciando Frontend na porta 3000..."
cd "$FRONTEND_DIR" || { log_error "Diretório frontend não encontrado"; exit 1; }

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    log_step "Instalando dependências frontend..."
    npm install --legacy-peer-deps
fi

# Iniciar frontend em background
BROWSER=none nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
log_info "Frontend iniciado (PID: $FRONTEND_PID)"

# 7. Status final
log_step "Verificando status final..."
sleep 10

echo ""
echo "🎉 WHATICKET SISTEMA INICIADO COM SUCESSO!"
echo ""
echo "📊 STATUS DOS SERVIÇOS:"
echo "  🔹 PostgreSQL: $(docker exec whaticket_postgres pg_isready -U whaticket 2>/dev/null || echo 'ERRO')"
echo "  🔹 Redis: $(docker exec whaticket_redis redis-cli ping 2>/dev/null || echo 'ERRO')"
echo "  🔹 Backend: $(curl -s http://localhost:8081/public-settings/appName 2>/dev/null | head -c 20 || echo 'ERRO')"
echo "  🔹 Frontend: Processo rodando (PID: $FRONTEND_PID)"
echo ""
echo "🌐 ACESSOS:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8081"
echo "  MailHog:  http://localhost:8025"
echo "  Bull Board: http://localhost:8081/admin/queues (admin/123456)"
echo ""
echo "🔑 CREDENCIAIS:"
echo "  Email: admin@admin.com"
echo "  Senha: admin"
echo ""
echo "📋 LOGS:"
echo "  Backend: $BACKEND_DIR/backend.log"
echo "  Frontend: $FRONTEND_DIR/frontend.log"
echo ""
echo "⏹️  PARA PARAR:"
echo "  docker-compose down"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
log_info "Sistema completo e funcional! 🚀"