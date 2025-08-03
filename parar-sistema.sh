#!/bin/bash

echo "🛑 PARANDO SISTEMA WHATICKET"
echo "============================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para matar processos por PID
kill_by_pid() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}🛑 Parando $service_name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null
            sleep 2
            
            # Force kill se ainda estiver rodando
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}🔪 Forçando parada de $service_name...${NC}"
                kill -9 "$pid" 2>/dev/null
            fi
        fi
        rm -f "$pid_file"
    fi
}

# Matar por PIDs salvos
kill_by_pid ".backend.pid" "Backend"
kill_by_pid ".frontend.pid" "Frontend"

# Matar processos por porta
echo -e "${BLUE}🔍 Procurando processos nas portas...${NC}"

# Backend (porta 8081)
if lsof -i :8081 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Matando processos na porta 8081...${NC}"
    lsof -ti :8081 | xargs kill -9 2>/dev/null || true
fi

# Frontend (porta 3000)
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Matando processos na porta 3000...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

# Matar processos específicos do Node.js relacionados ao projeto
echo -e "${BLUE}🔍 Matando processos Node.js relacionados...${NC}"
pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node.*whaticket" 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Verificar se as portas estão livres
echo -e "${BLUE}✅ Verificando se as portas estão livres...${NC}"
if lsof -i :8081 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Porta 8081 ainda em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 8081 livre${NC}"
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${RED}⚠️  Porta 3000 ainda em uso${NC}"
else
    echo -e "${GREEN}✅ Porta 3000 livre${NC}"
fi

# Limpar arquivos de log
echo -e "${BLUE}🧹 Limpando logs...${NC}"
rm -f whaticket/backend.log whaticket/frontend.log

echo -e "${GREEN}✅ Sistema parado com sucesso!${NC}"
echo -e "${BLUE}🚀 Para iniciar novamente: ./iniciar-sistema.sh${NC}"