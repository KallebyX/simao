#!/bin/bash

# Script de automação para desenvolvimento do Whaticket
# Aceita automaticamente comandos comuns para acelerar o desenvolvimento

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[AUTO-DEV] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[AUTO-DEV] AVISO: $1${NC}"
}

error() {
    echo -e "${RED}[AUTO-DEV] ERRO: $1${NC}"
}

info() {
    echo -e "${BLUE}[AUTO-DEV] INFO: $1${NC}"
}

# Comandos automáticos aceitos
ALLOWED_COMMANDS=(
    "cd" "ls" "ll" "pwd" "mkdir" "rmdir" "rm" "cp" "mv"
    "npm" "node" "npx" "yarn" "pnpm"
    "git" "gh" "docker" "docker-compose"
    "cat" "less" "more" "head" "tail" "grep" "find" "which"
    "chmod" "chown" "touch" "echo" "printf"
    "ps" "kill" "killall" "top" "htop"
    "curl" "wget" "ping" "netstat" "lsof"
    "sequelize-cli" "jest" "pm2"
    "createdb" "dropdb" "psql"
    "redis-cli" "redis-server"
)

# Função para verificar se comando é permitido
is_allowed_command() {
    local cmd="$1"
    for allowed in "${ALLOWED_COMMANDS[@]}"; do
        if [[ "$cmd" == "$allowed" ]]; then
            return 0
        fi
    done
    return 1
}

# Função para executar comando automaticamente
auto_execute() {
    local full_command="$1"
    local first_word=$(echo "$full_command" | awk '{print $1}')
    
    if is_allowed_command "$first_word"; then
        log "Executando automaticamente: $full_command"
        eval "$full_command"
        return $?
    else
        warn "Comando '$first_word' não está na lista de comandos automáticos"
        echo "Comandos permitidos: ${ALLOWED_COMMANDS[*]}"
        return 1
    fi
}

# Função principal
main() {
    echo -e "${CYAN}"
    echo "🤖 AUTO-DEV - Whaticket Development Assistant"
    echo "=============================================="
    echo -e "${NC}"
    
    if [ $# -eq 0 ]; then
        echo "Uso: $0 <comando>"
        echo ""
        echo "Comandos automáticos disponíveis:"
        printf '%s ' "${ALLOWED_COMMANDS[@]}"
        echo ""
        echo ""
        echo "Exemplos:"
        echo "  $0 'cd whaticket/backend'"
        echo "  $0 'npm install'"
        echo "  $0 'ls -la'"
        echo "  $0 'git status'"
        exit 1
    fi
    
    auto_execute "$*"
}

# Execução principal
main "$@"
