#!/bin/bash

# Setup e execução do Whaticket em ambiente de desenvolvimento local
# Este script configura e executa o sistema completo

set -e

echo "🚀 Configurando Whaticket para desenvolvimento local"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
}

# Verificar se o Docker está instalado e rodando
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instalando..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        newgrp docker
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker não está rodando. Iniciando..."
        sudo systemctl start docker
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instalando..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
}

# Verificar se o Node.js está instalado
check_node() {
    # Carregar NVM se disponível
    export NVM_DIR="/usr/local/share/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Verificar se NVM está disponível
    if ! command -v nvm &> /dev/null; then
        log "Instalando NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="/usr/local/share/nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Verificar se Node.js 16 está instalado
    if ! nvm list | grep -q "v16"; then
        log "Instalando Node.js 16.20.2..."
        nvm install 16.20.2
    fi
    
    # Usar Node.js 16
    nvm use 16.20.2
    
    if ! command -v npm &> /dev/null; then
        error "NPM não está disponível"
        exit 1
    fi
    
    log "Node.js $(node --version) e NPM $(npm --version) estão disponíveis"
}

# Subir serviços de infraestrutura
start_infrastructure() {
    log "Iniciando serviços de infraestrutura (PostgreSQL, Redis, MailHog)..."
    
    docker-compose up -d
    
    log "Aguardando serviços ficarem disponíveis..."
    sleep 10
    
    # Verificar se PostgreSQL está respondendo
    until docker exec whaticket_postgres pg_isready -U whaticket; do
        warn "Aguardando PostgreSQL..."
        sleep 2
    done
    
    # Verificar se Redis está respondendo
    until docker exec whaticket_redis redis-cli ping; do
        warn "Aguardando Redis..."
        sleep 2
    done
    
    log "✅ Serviços de infraestrutura estão rodando"
    log "📧 MailHog Web UI: http://localhost:8025"
}

# Instalar dependências do backend
setup_backend() {
    log "Instalando dependências do backend..."
    
    cd whaticket/backend
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log "Dependências do backend já instaladas, pulando..."
    fi
    
    log "Executando migrações do banco de dados..."
    npm run db:migrate || warn "Algumas migrações podem ter falhado (normal na primeira execução)"
    
    log "Executando seeds do banco de dados..."
    npm run db:seed || warn "Alguns seeds podem ter falhado (normal na primeira execução)"
    
    cd ../..
}

# Instalar dependências do frontend
setup_frontend() {
    log "Instalando dependências do frontend..."
    
    cd whaticket/frontend
    
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
        log "Instalando dependências do FontAwesome..."
        npm install --legacy-peer-deps @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-brands-svg-icons
    else
        log "Dependências do frontend já instaladas, pulando..."
    fi
    
    cd ../..
}

# Executar sistema
run_system() {
    log "🚀 Iniciando o sistema..."
    
    # Função para cleanup
    cleanup() {
        log "Parando aplicações..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        docker-compose down
        exit 0
    }
    
    # Registrar cleanup no SIGINT (Ctrl+C)
    trap cleanup SIGINT
    
    # Iniciar backend
    log "Iniciando backend na porta 8081..."
    cd whaticket/backend
    npm run dev:server &
    BACKEND_PID=$!
    cd ../..
    
    # Aguardar backend inicializar
    sleep 5
    
    # Iniciar frontend
    log "Iniciando frontend na porta 3000..."
    cd whaticket/frontend
    npm start &
    FRONTEND_PID=$!
    cd ../..
    
    log "✅ Sistema iniciado com sucesso!"
    log "🌐 Frontend: http://localhost:3000"
    log "🔧 Backend: http://localhost:8081"
    log "📧 MailHog: http://localhost:8025"
    log "🛑 Para parar o sistema, pressione Ctrl+C"
    
    # Aguardar processos
    wait $BACKEND_PID $FRONTEND_PID
}

# Menu principal
show_menu() {
    echo ""
    echo "🎯 Whaticket - Setup de Desenvolvimento Local"
    echo "=============================================="
    echo "1) Setup completo (infraestrutura + aplicação)"
    echo "2) Apenas infraestrutura (PostgreSQL, Redis, MailHog)"
    echo "3) Apenas aplicação (Backend + Frontend)"
    echo "4) Parar todos os serviços"
    echo "5) Logs dos serviços"
    echo "6) Status dos serviços"
    echo "0) Sair"
    echo ""
    read -p "Escolha uma opção: " choice
}

# Execução principal
case "${1:-menu}" in
    "full")
        check_docker
        check_node
        start_infrastructure
        setup_backend
        setup_frontend
        run_system
        ;;
    "infra")
        check_docker
        start_infrastructure
        log "Serviços de infraestrutura rodando. Use 'docker-compose logs -f' para ver logs."
        ;;
    "app")
        check_node
        setup_backend
        setup_frontend
        run_system
        ;;
    "stop")
        log "Parando todos os serviços..."
        docker-compose down
        pkill -f "npm.*dev:server" || true
        pkill -f "npm.*start" || true
        log "✅ Todos os serviços foram parados"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        log "Status dos serviços Docker:"
        docker-compose ps
        log "Processos Node.js rodando:"
        ps aux | grep -E "(npm|node)" | grep -v grep || log "Nenhum processo Node.js encontrado"
        ;;
    "menu"|*)
        while true; do
            show_menu
            case $choice in
                1)
                    check_docker
                    check_node
                    start_infrastructure
                    setup_backend
                    setup_frontend
                    run_system
                    ;;
                2)
                    check_docker
                    start_infrastructure
                    log "Serviços de infraestrutura rodando. Use 'docker-compose logs -f' para ver logs."
                    ;;
                3)
                    check_node
                    setup_backend
                    setup_frontend
                    run_system
                    ;;
                4)
                    log "Parando todos os serviços..."
                    docker-compose down
                    pkill -f "npm.*dev:server" || true
                    pkill -f "npm.*start" || true
                    log "✅ Todos os serviços foram parados"
                    ;;
                5)
                    docker-compose logs -f
                    ;;
                6)
                    log "Status dos serviços Docker:"
                    docker-compose ps
                    log "Processos Node.js rodando:"
                    ps aux | grep -E "(npm|node)" | grep -v grep || log "Nenhum processo Node.js encontrado"
                    ;;
                0)
                    log "Saindo..."
                    exit 0
                    ;;
                *)
                    error "Opção inválida. Tente novamente."
                    ;;
            esac
        done
        ;;
esac
