#!/bin/bash

# Script de desenvolvimento para macOS
# Resolve problemas de compatibilidade específicos do macOS

set -e

echo "🍎 Configurando Whaticket para desenvolvimento no macOS"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
}

# Função para parar todos os serviços
stop_services() {
    log "Parando todos os serviços..."
    docker-compose down
    pkill -f "node.*whaticket" || true
    pkill -f "npm.*start" || true
}

# Função para limpar cache
clean_cache() {
    log "Limpando cache..."
    rm -rf whaticket/backend/node_modules
    rm -rf whaticket/frontend/node_modules
    rm -rf whaticket/backend/dist
    docker system prune -f
}

# Função para instalar dependências localmente
install_dependencies() {
    log "Instalando dependências localmente..."
    
    # Backend
    cd whaticket/backend
    npm install
    npm run build
    cd ../..
    
    # Frontend
    cd whaticket/frontend
    npm install
    cd ../..
}

# Função para iniciar infraestrutura
start_infrastructure() {
    log "Iniciando infraestrutura (PostgreSQL, Redis, MailHog)..."
    docker-compose up -d postgres redis mailhog
    
    log "Aguardando serviços ficarem disponíveis..."
    sleep 10
    
    # Verificar PostgreSQL
    until docker exec whaticket_postgres pg_isready -U whaticket; do
        warn "Aguardando PostgreSQL..."
        sleep 2
    done
    
    # Verificar Redis
    until docker exec whaticket_redis redis-cli ping; do
        warn "Aguardando Redis..."
        sleep 2
    done
    
    log "✅ Infraestrutura pronta!"
}

# Função para executar migrações
run_migrations() {
    log "Executando migrações..."
    cd whaticket/backend
    npm run db:migrate
    npm run db:seed
    cd ../..
}

# Função para iniciar backend localmente
start_backend() {
    log "Iniciando backend localmente..."
    cd whaticket/backend
    
    # Configurar variáveis de ambiente para desenvolvimento local
    export NODE_ENV=development
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=whaticket
    export DB_PASS=whaticket123
    export DB_NAME=whaticket
    export REDIS_URI=redis://localhost:6379
    export PORT=8081
    
    # Iniciar em background
    nohup npm run dev:server > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    cd ../..
    log "Backend iniciado com PID: $BACKEND_PID"
}

# Função para iniciar frontend localmente
start_frontend() {
    log "Iniciando frontend localmente..."
    cd whaticket/frontend
    
    # Configurar variáveis de ambiente
    export REACT_APP_BACKEND_URL=http://localhost:8081
    export PORT=3000
    
    # Iniciar em background
    nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    cd ../..
    log "Frontend iniciado com PID: $FRONTEND_PID"
}

# Função para verificar status
check_status() {
    log "Verificando status dos serviços..."
    
    echo "🐳 Containers Docker:"
    docker ps --filter "name=whaticket" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "🖥️  Processos Node.js:"
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if ps -p $BACKEND_PID > /dev/null; then
            echo "✅ Backend rodando (PID: $BACKEND_PID)"
        else
            echo "❌ Backend parado"
        fi
    else
        echo "❌ Backend não iniciado"
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null; then
            echo "✅ Frontend rodando (PID: $FRONTEND_PID)"
        else
            echo "❌ Frontend parado"
        fi
    else
        echo "❌ Frontend não iniciado"
    fi
    
    echo ""
    echo "🌐 URLs de acesso:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8081"
    echo "   MailHog:  http://localhost:8025"
}

# Função para parar aplicação
stop_app() {
    log "Parando aplicação..."
    
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm backend.pid
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm frontend.pid
    fi
    
    log "Aplicação parada"
}

# Função para mostrar logs
show_logs() {
    if [ "$1" = "backend" ]; then
        if [ -f whaticket/backend.log ]; then
            tail -f whaticket/backend.log
        else
            error "Log do backend não encontrado"
        fi
    elif [ "$1" = "frontend" ]; then
        if [ -f whaticket/frontend.log ]; then
            tail -f whaticket/frontend.log
        else
            error "Log do frontend não encontrado"
        fi
    else
        error "Especifique 'backend' ou 'frontend'"
    fi
}

# Menu principal
case "${1:-}" in
    "full")
        stop_services
        clean_cache
        install_dependencies
        start_infrastructure
        run_migrations
        start_backend
        sleep 10
        start_frontend
        log "✅ Setup completo finalizado!"
        check_status
        ;;
    "infra")
        stop_services
        start_infrastructure
        ;;
    "app")
        stop_app
        start_backend
        sleep 10
        start_frontend
        ;;
    "stop")
        stop_services
        stop_app
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs $2
        ;;
    "clean")
        stop_services
        stop_app
        clean_cache
        ;;
    *)
        echo "🍎 Whaticket - Desenvolvimento para macOS"
        echo ""
        echo "Comandos disponíveis:"
        echo "  ./dev-mac.sh full     - Setup completo"
        echo "  ./dev-mac.sh infra    - Apenas infraestrutura"
        echo "  ./dev-mac.sh app      - Apenas aplicação"
        echo "  ./dev-mac.sh stop     - Parar tudo"
        echo "  ./dev-mac.sh status   - Verificar status"
        echo "  ./dev-mac.sh logs     - Ver logs (backend/frontend)"
        echo "  ./dev-mac.sh clean    - Limpar cache"
        echo ""
        echo "Exemplo: ./dev-mac.sh full"
        ;;
esac 