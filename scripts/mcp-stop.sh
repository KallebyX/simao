#!/bin/bash

# Script para parar servidores MCP do Whaticket
# Uso: ./scripts/mcp-stop.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   Parando MCP Tools - Whaticket${NC}"
    echo -e "${BLUE}================================${NC}"
}

stop_mcp_processes() {
    echo -e "${YELLOW}Procurando processos MCP ativos...${NC}"
    
    # Parar processos do server-filesystem
    FILESYSTEM_PIDS=$(pgrep -f "server-filesystem" || true)
    if [ ! -z "$FILESYSTEM_PIDS" ]; then
        echo -e "${GREEN}Parando servidor MCP Filesystem (PIDs: $FILESYSTEM_PIDS)...${NC}"
        echo "$FILESYSTEM_PIDS" | xargs kill -TERM
    fi
    
    # Parar processos do server-postgres
    POSTGRES_PIDS=$(pgrep -f "server-postgres" || true)
    if [ ! -z "$POSTGRES_PIDS" ]; then
        echo -e "${GREEN}Parando servidor MCP PostgreSQL (PIDs: $POSTGRES_PIDS)...${NC}"
        echo "$POSTGRES_PIDS" | xargs kill -TERM
    fi
    
    # Parar processos do puppeteer-mcp-server
    PUPPETEER_PIDS=$(pgrep -f "puppeteer-mcp-server" || true)
    if [ ! -z "$PUPPETEER_PIDS" ]; then
        echo -e "${GREEN}Parando servidor MCP Puppeteer (PIDs: $PUPPETEER_PIDS)...${NC}"
        echo "$PUPPETEER_PIDS" | xargs kill -TERM
    fi
    
    # Aguardar um pouco para os processos terminarem graciosamente
    sleep 2
    
    # Forçar parada se ainda houver processos rodando
    REMAINING_PIDS=$(pgrep -f "mcp-server|server-filesystem|server-postgres|puppeteer-mcp-server" || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${YELLOW}Forçando parada de processos restantes...${NC}"
        echo "$REMAINING_PIDS" | xargs kill -KILL
    fi
    
    echo -e "${GREEN}Todos os servidores MCP foram parados!${NC}"
}

show_status() {
    echo -e "${BLUE}Status dos processos MCP:${NC}"
    
    if pgrep -f "server-filesystem" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MCP Filesystem: Rodando${NC}"
    else
        echo -e "${RED}✗ MCP Filesystem: Parado${NC}"
    fi
    
    if pgrep -f "server-postgres" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MCP PostgreSQL: Rodando${NC}"
    else
        echo -e "${RED}✗ MCP PostgreSQL: Parado${NC}"
    fi
    
    if pgrep -f "puppeteer-mcp-server" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MCP Puppeteer: Rodando${NC}"
    else
        echo -e "${RED}✗ MCP Puppeteer: Parado${NC}"
    fi
}

show_help() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  stop     - Para todos os servidores MCP (padrão)"
    echo "  status   - Mostra status dos servidores MCP"
    echo "  help     - Mostra esta ajuda"
    echo ""
}

print_header

case "${1:-stop}" in
    stop)
        stop_mcp_processes
        ;;
    status)
        show_status
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