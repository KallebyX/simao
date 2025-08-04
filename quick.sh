#!/bin/bash

# Script de comandos rápidos para desenvolvimento do Whaticket
# Permite execução rápida de comandos comuns

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Diretórios
ROOT_DIR="/workspaces/simao"
BACKEND_DIR="$ROOT_DIR/whaticket/backend"
FRONTEND_DIR="$ROOT_DIR/whaticket/frontend"

log() { echo -e "${GREEN}[QUICK] $1${NC}"; }
info() { echo -e "${BLUE}[QUICK] $1${NC}"; }

# Função para execução rápida
quick_cmd() {
    case "$1" in
        # Navegação
        "root"|"r")
            cd "$ROOT_DIR" && pwd && ls -la
            ;;
        "backend"|"be"|"b")
            cd "$BACKEND_DIR" && pwd && ls -la
            ;;
        "frontend"|"fe"|"f")
            cd "$FRONTEND_DIR" && pwd && ls -la
            ;;
            
        # NPM Commands
        "install"|"i")
            log "Instalando dependências..."
            cd "$BACKEND_DIR" && npm install --legacy-peer-deps
            cd "$FRONTEND_DIR" && npm install --legacy-peer-deps
            cd "$ROOT_DIR" && npm install
            ;;
        "dev-backend"|"db")
            cd "$BACKEND_DIR" && npm run dev
            ;;
        "dev-frontend"|"df")
            cd "$FRONTEND_DIR" && npm start
            ;;
        "build-backend"|"bb")
            cd "$BACKEND_DIR" && npm run build
            ;;
        "build-frontend"|"bf")
            cd "$FRONTEND_DIR" && npm run build
            ;;
            
        # Database
        "migrate"|"m")
            cd "$BACKEND_DIR" && npx sequelize-cli db:migrate
            ;;
        "seed"|"s")
            cd "$BACKEND_DIR" && npx sequelize-cli db:seed:all
            ;;
        "reset-db"|"reset")
            cd "$BACKEND_DIR"
            npx sequelize-cli db:drop --force
            npx sequelize-cli db:create
            npx sequelize-cli db:migrate
            npx sequelize-cli db:seed:all
            ;;
            
        # Docker
        "docker-up"|"up")
            cd "$ROOT_DIR" && docker-compose up -d
            ;;
        "docker-down"|"down")
            cd "$ROOT_DIR" && docker-compose down
            ;;
        "docker-status"|"status")
            docker ps
            ;;
        "docker-logs"|"logs")
            cd "$ROOT_DIR" && docker-compose logs -f
            ;;
            
        # Git
        "git-status"|"gs")
            git status
            ;;
        "git-add"|"ga")
            git add .
            ;;
        "git-commit"|"gc")
            git commit -m "${2:-Update}"
            ;;
        "git-push"|"gp")
            git push
            ;;
            
        # Limpeza
        "clean"|"c")
            log "Limpando node_modules e reinstalando..."
            rm -rf "$BACKEND_DIR/node_modules" "$FRONTEND_DIR/node_modules" "$ROOT_DIR/node_modules"
            rm -rf "$BACKEND_DIR/package-lock.json" "$FRONTEND_DIR/package-lock.json" "$ROOT_DIR/package-lock.json"
            cd "$BACKEND_DIR" && npm install --legacy-peer-deps
            cd "$FRONTEND_DIR" && npm install --legacy-peer-deps
            cd "$ROOT_DIR" && npm install
            ;;
            
        # Sistema
        "ps"|"processes")
            ps aux | grep -E "(node|npm|whaticket)"
            ;;
        "kill-node"|"kn")
            killall node 2>/dev/null || true
            killall npm 2>/dev/null || true
            ;;
            
        # Testes
        "test-backend"|"tb")
            cd "$BACKEND_DIR" && npm test
            ;;
        "test-frontend"|"tf")
            cd "$FRONTEND_DIR" && npm test
            ;;
            
        # Sistema completo
        "start"|"start-all")
            log "Iniciando sistema completo..."
            cd "$ROOT_DIR"
            docker-compose up -d
            sleep 5
            cd "$BACKEND_DIR" && npm run dev &
            sleep 3
            cd "$FRONTEND_DIR" && npm start &
            ;;
        "stop"|"stop-all")
            log "Parando sistema completo..."
            killall node 2>/dev/null || true
            killall npm 2>/dev/null || true
            cd "$ROOT_DIR" && docker-compose down
            ;;
            
        # Help
        "help"|"h"|*)
            echo -e "${CYAN}Comandos rápidos disponíveis:${NC}"
            echo ""
            echo "📁 Navegação:"
            echo "  root, r        - Ir para raiz do projeto"
            echo "  backend, be, b - Ir para backend"
            echo "  frontend, fe, f- Ir para frontend"
            echo ""
            echo "📦 NPM:"
            echo "  install, i     - Instalar todas as dependências"
            echo "  dev-backend, db- Rodar backend em desenvolvimento"
            echo "  dev-frontend,df- Rodar frontend em desenvolvimento"
            echo "  build-backend, bb - Build do backend"
            echo "  build-frontend,bf - Build do frontend"
            echo ""
            echo "🗄️ Database:"
            echo "  migrate, m     - Executar migrações"
            echo "  seed, s        - Executar seeders"
            echo "  reset-db, reset- Resetar banco completamente"
            echo ""
            echo "🐳 Docker:"
            echo "  docker-up, up  - Subir containers"
            echo "  docker-down, down - Parar containers"
            echo "  docker-status, status - Status dos containers"
            echo "  docker-logs, logs - Ver logs dos containers"
            echo ""
            echo "🔧 Sistema:"
            echo "  start, start-all - Iniciar sistema completo"
            echo "  stop, stop-all - Parar sistema completo"
            echo "  clean, c       - Limpar e reinstalar dependências"
            echo "  ps, processes  - Ver processos rodando"
            echo "  kill-node, kn  - Matar processos Node"
            echo ""
            echo "🧪 Testes:"
            echo "  test-backend, tb - Testes do backend"
            echo "  test-frontend,tf - Testes do frontend"
            echo ""
            echo "📝 Git:"
            echo "  git-status, gs - Status do git"
            echo "  git-add, ga    - Add arquivos"
            echo "  git-commit, gc - Commit com mensagem"
            echo "  git-push, gp   - Push para repositório"
            ;;
    esac
}

# Execução
quick_cmd "$@"
