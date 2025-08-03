#!/bin/bash

# Script minimalista para desenvolvimento no macOS
# Foca apenas em funcionalidade básica

set -e

echo "🍎 Whaticket - Setup Minimalista para macOS"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Parar tudo
stop_all() {
    log "Parando todos os serviços..."
    docker-compose down 2>/dev/null || true
    pkill -f "node.*whaticket" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    rm -f backend.pid frontend.pid
}

# Iniciar infraestrutura
start_infra() {
    log "Iniciando infraestrutura..."
    docker-compose up -d postgres redis mailhog
    
    log "Aguardando serviços (máximo 60s)..."
    
    # Timeout de 60 segundos
    local timeout=60
    local counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker exec whaticket_postgres pg_isready -U whaticket 2>/dev/null; then
            log "✅ PostgreSQL pronto!"
            break
        fi
        
        warn "Aguardando PostgreSQL... ($counter/$timeout)"
        sleep 3
        counter=$((counter + 3))
    done
    
    if [ $counter -ge $timeout ]; then
        error "Timeout aguardando PostgreSQL"
        exit 1
    fi
    
    log "✅ Infraestrutura pronta!"
}

# Iniciar backend simples
start_backend() {
    log "Iniciando backend..."
    cd whaticket/backend
    
    # Configurar variáveis
    export NODE_ENV=development
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=whaticket
    export DB_PASS=whaticket123
    export DB_NAME=whaticket
    export REDIS_URI=redis://localhost:6379
    export PORT=8081
    export JWT_SECRET=dev-secret-key
    export JWT_EXPIRES_IN=7d
    
    # Iniciar com ts-node-dev (sem compilação)
    nohup npx ts-node-dev --respawn --transpile-only src/server.ts > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    
    cd ../..
    
    # Aguardar backend iniciar
    log "Aguardando backend iniciar..."
    sleep 15
    
    log "✅ Backend iniciado (PID: $(cat backend.pid))"
}

# Iniciar frontend
start_frontend() {
    log "Iniciando frontend..."
    cd whaticket/frontend
    
    # Configurar variáveis
    export REACT_APP_BACKEND_URL=http://localhost:8081
    export PORT=3000
    
    # Iniciar em background
    nohup npm start > ../frontend.log 2>&1 &
    echo $! > ../frontend.pid
    
    cd ../..
    
    # Aguardar frontend iniciar
    log "Aguardando frontend iniciar..."
    sleep 20
    
    log "✅ Frontend iniciado (PID: $(cat frontend.pid))"
}

# Verificar status
check_status() {
    echo ""
    echo "🐳 Containers Docker:"
    docker ps --filter "name=whaticket" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Nenhum container rodando"
    
    echo ""
    echo "🖥️  Processos Node.js:"
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "✅ Backend rodando (PID: $BACKEND_PID)"
        else
            echo "❌ Backend parado"
        fi
    else
        echo "❌ Backend não iniciado"
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
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

# Parar aplicação
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

# Menu principal
case "${1:-}" in
    "start")
        stop_all
        start_infra
        start_backend
        start_frontend
        log "✅ Setup completo!"
        check_status
        ;;
    "stop")
        stop_all
        stop_app
        ;;
    "status")
        check_status
        ;;
    "logs")
        if [ "$2" = "backend" ]; then
            tail -f whaticket/backend.log 2>/dev/null || error "Log não encontrado"
        elif [ "$2" = "frontend" ]; then
            tail -f whaticket/frontend.log 2>/dev/null || error "Log não encontrado"
        else
            echo "Uso: ./dev-minimal.sh logs [backend|frontend]"
        fi
        ;;
    "restart")
        stop_all
        stop_app
        sleep 2
        start_infra
        start_backend
        start_frontend
        log "✅ Reiniciado!"
        check_status
        ;;
    *)
        echo "🍎 Whaticket - Setup Minimalista para macOS"
        echo ""
        echo "Comandos:"
        echo "  ./dev-minimal.sh start     - Iniciar tudo"
        echo "  ./dev-minimal.sh stop      - Parar tudo"
        echo "  ./dev-minimal.sh restart   - Reiniciar"
        echo "  ./dev-minimal.sh status    - Verificar status"
        echo "  ./dev-minimal.sh logs      - Ver logs (backend/frontend)"
        echo ""
        echo "Exemplo: ./dev-minimal.sh start"
        ;;
esac 