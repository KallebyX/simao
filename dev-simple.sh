#!/bin/bash

# Script simples para desenvolvimento no macOS
# Foca em funcionalidade básica sem conflitos de versão

set -e

echo "🍎 Whaticket - Setup Simples para macOS"

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

# Limpar cache
clean_cache() {
    log "Limpando cache..."
    rm -rf whaticket/backend/node_modules
    rm -rf whaticket/frontend/node_modules
    rm -rf whaticket/backend/dist
    docker system prune -f
}

# Instalar dependências básicas
install_deps() {
    log "Instalando dependências..."
    
    # Backend
    cd whaticket/backend
    npm install --legacy-peer-deps
    cd ../..
    
    # Frontend
    cd whaticket/frontend
    npm install --legacy-peer-deps
    cd ../..
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

# Executar migrações
run_migrations() {
    log "Executando migrações..."
    cd whaticket/backend
    
    # Configurar variáveis para migrações
    export NODE_ENV=development
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=whaticket
    export DB_PASS=whaticket123
    export DB_NAME=whaticket
    
    # Compilar primeiro
    log "Compilando TypeScript..."
    npm run build
    
    # Executar migrações
    log "Executando migrações..."
    npm run db:migrate
    npm run db:seed
    cd ../..
}

# Iniciar backend
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
    
    # Compilar
    npm run build
    
    # Iniciar em background
    nohup node dist/server.js > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    
    cd ../..
    
    # Aguardar backend iniciar
    log "Aguardando backend iniciar..."
    sleep 10
    
    # Verificar se está rodando
    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        log "✅ Backend iniciado (PID: $(cat backend.pid))"
    else
        warn "Backend pode não estar totalmente pronto, mas continuando..."
    fi
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
    sleep 15
    
    # Verificar se está rodando
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log "✅ Frontend iniciado (PID: $(cat frontend.pid))"
    else
        warn "Frontend pode não estar totalmente pronto, mas continuando..."
    fi
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
        clean_cache
        install_deps
        start_infra
        run_migrations
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
            echo "Uso: ./dev-simple.sh logs [backend|frontend]"
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
        echo "🍎 Whaticket - Setup Simples para macOS"
        echo ""
        echo "Comandos:"
        echo "  ./dev-simple.sh start     - Iniciar tudo"
        echo "  ./dev-simple.sh stop      - Parar tudo"
        echo "  ./dev-simple.sh restart   - Reiniciar"
        echo "  ./dev-simple.sh status    - Verificar status"
        echo "  ./dev-simple.sh logs      - Ver logs (backend/frontend)"
        echo ""
        echo "Exemplo: ./dev-simple.sh start"
        ;;
esac 