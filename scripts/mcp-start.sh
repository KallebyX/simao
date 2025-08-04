#!/bin/bash

# Script para inicializar servidores MCP para desenvolvimento do Whaticket
# Uso: ./scripts/mcp-start.sh [servidor]

set -e

PROJECT_ROOT="/workspaces/simao"
MCP_CONFIG="$PROJECT_ROOT/mcp-config.json"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    MCP Tools - Whaticket       ${NC}"
    echo -e "${BLUE}================================${NC}"
}

start_filesystem_server() {
    echo -e "${GREEN}Iniciando servidor MCP Filesystem...${NC}"
    npx @modelcontextprotocol/server-filesystem "$PROJECT_ROOT" &
    echo "PID: $!"
}

start_postgres_server() {
    echo -e "${GREEN}Iniciando servidor MCP PostgreSQL...${NC}"
    
    # Verificar se o PostgreSQL está rodando
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${YELLOW}PostgreSQL não está rodando. Iniciando com Docker...${NC}"
        docker-compose up -d postgres
        sleep 5
    fi
    
    # Usar as credenciais corretas do docker-compose.yml
    export POSTGRES_CONNECTION_STRING="postgresql://whaticket:whaticket123@localhost:5432/whaticket"
    npx @modelcontextprotocol/server-postgres "postgresql://whaticket:whaticket123@localhost:5432/whaticket" &
    echo "PID: $!"
}

start_puppeteer_server() {
    echo -e "${GREEN}Iniciando servidor MCP Puppeteer...${NC}"
    npx puppeteer-mcp-server &
    echo "PID: $!"
}

start_all_servers() {
    echo -e "${GREEN}Iniciando todos os servidores MCP...${NC}"
    start_filesystem_server
    start_postgres_server  
    start_puppeteer_server
    
    echo -e "${GREEN}Todos os servidores MCP foram iniciados!${NC}"
    echo -e "${YELLOW}Use 'ps aux | grep mcp' para ver os processos${NC}"
    echo -e "${YELLOW}Use './scripts/mcp-stop.sh' para parar todos${NC}"
}

show_help() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  filesystem  - Inicia apenas o servidor MCP Filesystem"
    echo "  postgres    - Inicia apenas o servidor MCP PostgreSQL"
    echo "  puppeteer   - Inicia apenas o servidor MCP Puppeteer"
    echo "  all         - Inicia todos os servidores (padrão)"
    echo "  help        - Mostra esta ajuda"
    echo ""
}

print_header

case "${1:-all}" in
    filesystem)
        start_filesystem_server
        ;;
    postgres)
        start_postgres_server
        ;;
    puppeteer)
        start_puppeteer_server
        ;;
    all)
        start_all_servers
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Comando desconhecido: $1${NC}"
        show_help
        exit 1
        ;;
esac